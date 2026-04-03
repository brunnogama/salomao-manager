from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.backends import default_backend
from signxml import XMLSigner, methods

# O padrão ABRASF do governo e das prefeituras brasileiras EXIGE criptografia SHA1.
# Por design, o `signxml` moderno proíbe o uso de SHA1 por diretrizes globais de segurança (InvalidInput).
# Fazemos um monkeypatch para forçar a permissão, como é obrigatório na integração fiscal local.
XMLSigner.check_deprecated_methods = lambda self: None
class CertificateSigner:
    def __init__(self, cert_path, password, pfx_data=None):
        self.cert_path = cert_path
        self.password = password.encode()
        self.pfx_data = pfx_data

    def sign_xml(self, xml_element):
        if self.pfx_data is not None:
            pfx_data = self.pfx_data
        else:
            with open(self.cert_path, "rb") as f:
                pfx_data = f.read()
        private_key, certificate, _ = pkcs12.load_key_and_certificates(
            pfx_data, self.password, default_backend()
        )
        signer = XMLSigner(method=methods.enveloped, signature_algorithm="rsa-sha1")
        
        return signer.sign(xml_element, key=private_key, cert=[certificate])
