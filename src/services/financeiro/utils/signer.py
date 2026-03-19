from cryptography.hazmat.primitives.serialization import pkcs12
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
