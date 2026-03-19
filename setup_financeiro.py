import os

# 1. Definição da estrutura de pastas do Ecossistema Salomão (Módulo Financeiro)
base_path = "ecossistema_salomao/modules/financeiro"
folders = [
    f"{base_path}/certs",
    f"{base_path}/providers",
    f"{base_path}/utils",
]

for folder in folders:
    os.makedirs(folder, exist_ok=True)
    # Cria um arquivo .gitkeep para garantir que pastas vazias sejam rastreadas (exceto certs)
    if "certs" not in folder:
        with open(os.path.join(folder, ".gitkeep"), "w") as f: pass

# 2. Criação do arquivo .env (Cofre de Senhas)
env_content = """# Senhas dos Certificados por Cidade
CERT_PASSWORD_RJ="mudar_para_senha_real"
CERT_PASSWORD_SP="mudar_para_senha_real"

# Endpoints de Homologação (Ambiente de Testes)
URL_WSDL_RJ="https://homologacao.notacarioca.rio.gov.br/WSNacional/nfse.asmx?wsdl"
"""
with open(os.path.join(base_path, ".env"), "w") as f:
    f.write(env_content)

# 3. Implementação do Assinador Digital (Utilizando cryptography e signxml)
signer_code = """import os
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.backends import default_backend
from signxml import XMLSigner

class CertificateSigner:
    def __init__(self, cert_path, password):
        self.cert_path = cert_path
        self.password = password.encode()

    def sign_xml(self, xml_element):
        \"\"\"
        Carrega o certificado PFX e aplica a assinatura digital no padrão ABRASF/NFS-e.
        \"\"\"
        if not os.path.exists(self.cert_path):
            raise FileNotFoundError(f"Certificado não encontrado em: {self.cert_path}")

        with open(self.cert_path, "rb") as f:
            pfx_data = f.read()
        
        private_key, certificate, additional_certificates = pkcs12.load_key_and_certificates(
            pfx_data, self.password, default_backend()
        )

        # Assinatura Enveloped com algoritmo RSA-SHA1 (Padrão das Prefeituras)
        signer = XMLSigner(method=XMLSigner.Methods.enveloped, signature_algorithm="rsa-sha1")
        signed_root = signer.sign(xml_element, key=private_key, cert=certificate)
        
        return signed_root
"""
with open(os.path.join(base_path, "utils/signer.py"), "w") as f:
    f.write(signer_code)

# 4. Implementação do Provider Rio de Janeiro (Esqueleto do RPS)
rj_provider_code = """from lxml import etree

class RioJaneiroProvider:
    def __init__(self, inscricao_municipal, cnpj_prestador):
        self.im = inscricao_municipal
        self.cnpj = cnpj_prestador

    def preparar_rps(self, dados_servico):
        \"\"\"
        Monta o XML do Recibo Provisório de Serviços (RPS) seguindo o manual da Nota Carioca.
        \"\"\"
        # Namespace padrão ABRASF
        NS = "http://www.abrasf.org.br/nfse.xsd"
        root = etree.Element("{%s}EnviarLoteRpsEnvio" % NS, nsmap={None: NS})
        
        # Estrutura básica de Lote e RPS
        lote = etree.SubElement(root, "LoteRps", Id="LOTE1")
        etree.SubElement(lote, "NumeroLote").text = "1"
        etree.SubElement(lote, "Cnpj").text = self.cnpj
        etree.SubElement(lote, "InscricaoMunicipal").text = self.im
        etree.SubElement(lote, "QuantidadeRps").text = "1"
        
        # Lista de RPS (onde os dados reais do serviço entram)
        lista_rps = etree.SubElement(lote, "ListaRps")
        rps = etree.SubElement(lista_rps, "Rps")
        inf_rps = etree.SubElement(rps, "InfRps", Id="RPS1")
        
        # Aqui o sistema preencherá com dados_servico (Tomador, Valor, ItemServico)
        # TODO: Mapear campos de impostos (ISS, PIS, COFINS)
        
        return root
"""
with open(os.path.join(base_path, "providers/rj_rio.py"), "w") as f:
    f.write(rj_provider_code)

print("✅ Estrutura do Módulo Financeiro criada com sucesso no Antigravity!")