import os

# Definição da estrutura dentro do padrão do salomao-manager
base_path = "src/services/financeiro"
folders = [
    f"{base_path}/certs",
    f"{base_path}/providers",
    f"{base_path}/utils",
]

for folder in folders:
    os.makedirs(folder, exist_ok=True)
    if "certs" not in folder:
        with open(os.path.join(folder, ".gitkeep"), "w") as f: pass

# 1. Arquivo de configuração (Cofre)
env_content = """CERT_PASSWORD_RJ="mudar_para_senha_real"
URL_WSDL_RJ="https://homologacao.notacarioca.rio.gov.br/WSNacional/nfse.asmx?wsdl"
"""
with open(os.path.join(base_path, ".env"), "w") as f:
    f.write(env_content)

# 2. Assinador Digital
signer_code = """from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.backends import default_backend
from signxml import XMLSigner

class CertificateSigner:
    def __init__(self, cert_path, password):
        self.cert_path = cert_path
        self.password = password.encode()

    def sign_xml(self, xml_element):
        with open(self.cert_path, "rb") as f:
            pfx_data = f.read()
        private_key, certificate, _ = pkcs12.load_key_and_certificates(
            pfx_data, self.password, default_backend()
        )
        signer = XMLSigner(method=XMLSigner.Methods.enveloped, signature_algorithm="rsa-sha1")
        return signer.sign(xml_element, key=private_key, cert=certificate)
"""
with open(os.path.join(base_path, "utils/signer.py"), "w") as f:
    f.write(signer_code)

print("✅ Estrutura criada em src/services/financeiro")
