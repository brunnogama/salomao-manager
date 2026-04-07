# filepath: src/services/financeiro/signature_server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from utils.signer import CertificateSigner
from providers.nacional_adn import NacionalAdnProvider
import os
import xml.etree.ElementTree as ET
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from the React frontend

@app.route('/assinar-nota', methods=['POST'])
def assinar_nota():
    try:
        # Check if form data is used
        if request.content_type and 'multipart/form-data' in request.content_type:
            cidade = request.form.get('cidade')
            # Extract other form fields if needed (prestador/servico are stringified JSON)
            dados = request.form
        else:
            dados = request.json
            cidade = dados.get('cidade')
        
        password = os.getenv(f"CERT_PASSWORD_{cidade.upper().replace(' ', '_')}")
        if not password:
            return jsonify({"erro": f"Senha não configurada para {cidade}"}), 400

        pfx_data = None
        cert_path = None
        
        # Check if file was uploaded
        if 'certificado' in request.files:
            pfx_file = request.files['certificado']
            pfx_data = pfx_file.read()
        else:
            # Fallback for local cert
            cert_name = f"certificado_{cidade.lower().replace(' ', '_')}.pfx"
            cert_path = os.path.join(os.path.dirname(__file__), 'certs', cert_name)
            if not os.path.exists(cert_path):
                return jsonify({"erro": "Certificado não enviado na requisição e não encontrado localmente."}), 400

        # 2. Prepara o XML (Padrão Nacional ADN / DPS)
        if cidade == "Rio de Janeiro":
            import json
            import random
            
            prestador = json.loads(dados.get('prestador', '{}')) if isinstance(dados.get('prestador'), str) else dados.get('prestador', {})
            provider = NacionalAdnProvider(inscricao_municipal=prestador.get('im', '12345'), cnpj_prestador=prestador.get('cnpj', '00000000000100'))
            xml_bruto = provider.preparar_dps(dados)
            
            # 3. Assina (TODO: Adicionar mTLS no futuro para transmissão real)
            signer = CertificateSigner(cert_path=cert_path, password=password, pfx_data=pfx_data)
            xml_assinado = signer.sign_xml(xml_bruto)
            
            # Serialize o Element do lxml para string UTF-8
            from lxml import etree as LxmlET
            if isinstance(xml_assinado, LxmlET._Element):
                xml_string = LxmlET.tostring(xml_assinado, encoding='UTF-8', xml_declaration=False).decode('utf-8')
            else:
                xml_string = xml_assinado.decode('utf-8') if hasattr(xml_assinado, 'decode') else str(xml_assinado)
            
            # Purifica os nós em Base64 de quebras de linha originadas pelo signxml. O validador da Receita (Sefin) C# falha fatalmente
            # com quebras de linha \n durante a decodificação Base64, vomitando o infame "E0715 - Certificado Digital Inválido".
            import re
            xml_string = re.sub(r'<X509Certificate>\s*([^<]+)\s*</X509Certificate>', lambda m: '<X509Certificate>' + m.group(1).replace('\n', '').replace('\r', '').strip() + '</X509Certificate>', xml_string)
            xml_string = re.sub(r'<SignatureValue>\s*([^<]+)\s*</SignatureValue>', lambda m: '<SignatureValue>' + m.group(1).replace('\n', '').replace('\r', '').strip() + '</SignatureValue>', xml_string)
            
            if not xml_string.startswith('<?xml'):
                xml_string = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml_string
            
            from utils.mtls_extractor import MTlsExtractor
            import requests
            import gzip
            import base64
            import json

            # API Base URL - Emissor Nacional (Produção)
            # Conforme portal Gov.br: https://sefin.nfse.gov.br/SefinNacional/docs/index
            ADN_API_URL = os.getenv("ADN_API_URL", "https://sefin.nfse.gov.br/SefinNacional/nfse")
            
            extractor = MTlsExtractor(cert_path=cert_path, password=password, pfx_data=pfx_data)
            try:
                temp_cert, temp_key = extractor.extract_to_temp_files()
                
                # A Sefin Nacional exige (Documentação):
                # 1. XML assinado compactado em GZIP
                # 2. Codificado em Base64
                # 3. Encapsulado e enviado via JSON
                xml_bytes = xml_string.encode('utf-8')
                xml_gzipped = gzip.compress(xml_bytes)
                xml_base64 = base64.b64encode(xml_gzipped).decode('utf-8')
                
                payload = {
                    "dpsXmlGZipB64": xml_base64
                }

                headers = {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }

                # Executa a Transmissão via mTLS (Certificado Cliente)
                print(f"Transmitindo DPS para a Sefin Nacional via mTLS (JSON Base64Gzip): {ADN_API_URL}")
                api_response = requests.post(
                    ADN_API_URL, 
                    json=payload, 
                    headers=headers, 
                    cert=(temp_cert, temp_key),
                    timeout=15
                )
                
                api_response.raise_for_status()
                response_data = api_response.json() if 'application/json' in api_response.headers.get('Content-Type', '') else api_response.content
                
                try:
                    # Descompactar resposta se ela vier encapsulada em JSON base64
                    if isinstance(response_data, dict) and "nfseXmlGZipB64" in response_data:
                        b64_resp_gz = base64.b64decode(response_data["nfseXmlGZipB64"])
                        response_xml_str = gzip.decompress(b64_resp_gz).decode('utf-8')
                    else:
                        response_xml_str = api_response.text

                    chave_acesso = None
                    if isinstance(response_data, dict) and "chaveAcesso" in response_data:
                        chave_acesso = response_data["chaveAcesso"]

                    if not chave_acesso:
                        # Parse do retorno XML oficial para capturar a Chave de Acesso gerada (fallback)
                        root_resp = LxmlET.fromstring(response_xml_str.encode('utf-8'))
                        ns = {'ns': 'http://www.sped.fazenda.gov.br/nfse'}
                        ch_element = root_resp.find('.//ns:chNFSe', ns)
                        
                        if ch_element is not None and ch_element.text:
                            chave_acesso = ch_element.text
                        else:
                            # Fallback pelo atributo Id
                            inf_nfse = root_resp.find('.//ns:infNFSe', ns)
                            if inf_nfse is not None:
                                id_attr = inf_nfse.get('Id', '')
                                if id_attr.startswith('NFS'):
                                    chave_acesso = id_attr.replace('NFS', '')

                    if not chave_acesso:
                        raise ValueError(f"Chave de acesso não encontrada. Retorno: {response_xml_str}")
                        
                    nf_number = None
                    try:
                        n_element = root_resp.find('.//ns:nNFSe', ns)
                        if n_element is not None and n_element.text:
                            nf_number = n_element.text
                    except Exception:
                        pass
                        
                    # POLLING DA PREFEITURA: Aguardar o número da NF
                    if not nf_number and chave_acesso:
                        import time
                        print(f"Número da NF pendente. Iniciando polling para a chave {chave_acesso}...")
                        for attempt in range(4): # Tenta por até 8 segundos
                            time.sleep(2)
                            try:
                                poll_resp = requests.get(
                                    f"{ADN_API_URL}/{chave_acesso}",
                                    headers={"Accept": "application/json"},
                                    cert=(temp_cert, temp_key),
                                    timeout=10
                                )
                                if poll_resp.status_code == 200:
                                    poll_data = poll_resp.json() if 'application/json' in poll_resp.headers.get('Content-Type', '') else poll_resp.content
                                    if isinstance(poll_data, dict) and "nfseXmlGZipB64" in poll_data:
                                        b64_gz = base64.b64decode(poll_data["nfseXmlGZipB64"])
                                        p_xml_str = gzip.decompress(b64_gz).decode('utf-8')
                                        p_root = LxmlET.fromstring(p_xml_str.encode('utf-8'))
                                        p_element = p_root.find('.//ns:nNFSe', ns)
                                        if p_element is not None and p_element.text:
                                            nf_number = p_element.text
                                            response_xml_str = p_xml_str # Atualiza XML oficial
                                            print(f"✓ Sucesso no Polling! NF Gerada: {nf_number}")
                                            break
                            except Exception as poll_err:
                                print(f"Aguardando processamento ({attempt+1}/8)... {str(poll_err)}")
                                
                except Exception as parse_e:
                    raise ValueError(f"Falha ao ler XML/Chave de Retorno: {str(parse_e)}. Raw: {api_response.text}")

                return jsonify({
                    "status": "sucesso",
                    "xml_enviado": xml_string,
                    "xml": response_xml_str,
                    "chave_acesso": chave_acesso,
                    "nf_number": nf_number,
                    "pdf_url": f"https://www.nfse.gov.br/consultapublica?chave={chave_acesso}"
                })
                
            except requests.exceptions.HTTPError as http_e:
                raise Exception(f"Rejeição da Receita Federal (HTTP {api_response.status_code}): {api_response.text}")
            except Exception as e:
                raise Exception(f"Erro Crítico na Transmissão: {str(e)}")
            finally:
                extractor.cleanup() # Auto-destruição imediata dos arquivos temporários de chave privativa


        return jsonify({"erro": "Provedor para esta cidade ainda não implementado"}), 501

    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        print("ERRO 500:", trace)
        return jsonify({
            "erro": str(e),
            "traceback": trace
        }), 500

if __name__ == '__main__':
    # Roda na porta 5000 para o React consumir
    app.run(port=5000)