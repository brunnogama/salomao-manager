import traceback
from src.services.financeiro.utils.signer import CertificateSigner
from src.services.financeiro.providers.rj_rio import RioJaneiroProvider
import json
from dotenv import load_dotenv
import os

load_dotenv()

try:
    dados = {
        "prestador": {"im": "123456", "cnpj": "00000000000100"},
        "tomador": {"nome": "Teste", "cnpj": "123"},
        "servico": {"valor": 100, "discriminacao": "Teste"}
    }
    
    provider = RioJaneiroProvider(inscricao_municipal="12345", cnpj_prestador="000")
    xml_bruto = provider.preparar_rps(dados)
    
    password = os.getenv("CERT_PASSWORD_RIO_DE_JANEIRO")
    
    # We do not have a test PFX here, but we can check if preparar_rps fails!
    print("XML bruto gerado:", xml_bruto)
except Exception as e:
    print("ERRO:", traceback.format_exc())
