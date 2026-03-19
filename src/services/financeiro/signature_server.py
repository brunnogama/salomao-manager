# filepath: src/services/financeiro/signature_server.py
from flask import Flask, request, jsonify
from utils.signer import CertificateSigner
from providers.rj_rio import RioJaneiroProvider
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

@app.route('/assinar-nota', methods=['POST'])
def assinar_nota():
    try:
        dados = request.json
        cidade = dados.get('cidade')
        
        # 1. Busca o certificado correto na pasta certs/
        cert_name = f"certificado_{cidade.lower().replace(' ', '_')}.pfx"
        cert_path = os.path.join(os.path.dirname(__file__), 'certs', cert_name)
        password = os.getenv(f"CERT_PASSWORD_{cidade.upper().replace(' ', '_')}")

        if not password:
            return jsonify({"erro": f"Senha não configurada para {cidade}"}), 400

        # 2. Prepara o XML (Exemplo Rio de Janeiro)
        if cidade == "Rio de Janeiro":
            provider = RioJaneiroProvider(inscricao_municipal="12345", cnpj_prestador="00000000000100")
            xml_bruto = provider.preparar_rps(dados)
            
            # 3. Assina
            signer = CertificateSigner(cert_path, password)
            xml_assinado = signer.sign_xml(xml_bruto)
            
            return jsonify({
                "status": "sucesso",
                "xml": xml_assinado.decode('utf-8')
            })

        return jsonify({"erro": "Provedor para esta cidade ainda não implementado"}), 501

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    # Roda na porta 5000 para o React consumir
    app.run(port=5000)