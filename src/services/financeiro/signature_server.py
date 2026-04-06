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
                xml_string = LxmlET.tostring(xml_assinado, encoding='utf-8').decode('utf-8')
            else:
                xml_string = xml_assinado.decode('utf-8') if hasattr(xml_assinado, 'decode') else str(xml_assinado)
            
            # MOCK: Simulando o retorno oficial da Receita Federal (Nacional)
            # Chave de acesso possui 44 dígitos
            uf = "33" # RJ
            ano_mes = dict(dados).get('dataEmissao', '2604').replace('-', '')[2:6]
            cnpj_limpo = prestador.get('cnpj', '00000000000100').replace('.', '').replace('/', '').replace('-', '')
            random_key = f"{uf}{ano_mes}{cnpj_limpo}55001{random.randint(100000000, 999999999)}1"
            chave_acesso = random_key.zfill(44)
            
            return jsonify({
                "status": "sucesso",
                "xml": xml_string,
                "chave_acesso": chave_acesso,
                "pdf_url": f"https://www.nfse.gov.br/consultapublica?chave={chave_acesso}"
            })

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