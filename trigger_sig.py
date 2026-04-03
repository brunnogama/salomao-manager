import traceback
from src.services.financeiro.utils.signer import CertificateSigner
from src.services.financeiro.providers.rj_rio import RioJaneiroProvider

try:
    dados = {
        "prestador": {"im": "123456", "cnpj": "00000000000100"},
        "tomador": {"nome": "Teste", "cnpj": "123"},
        "servico": {"valor": 100, "discriminacao": "Teste"}
    }
    
    provider = RioJaneiroProvider(inscricao_municipal="12345", cnpj_prestador="000")
    xml_bruto = provider.preparar_rps(dados)
    
    signer = CertificateSigner(cert_path="nao_existe.pfx", password="teste", pfx_data=b"dummy")
    signer.sign_xml(xml_bruto)
    print("Sucesso")
except Exception as e:
    print(traceback.format_exc())
