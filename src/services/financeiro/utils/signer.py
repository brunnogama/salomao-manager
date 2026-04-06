from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.backends import default_backend
from signxml import XMLSigner, methods, namespaces

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
        
        # Identificar a raiz assinável (infDPS) para gerar a Reference URI correta
        node_to_sign = xml_element.find('.//*[@Id]')
        ref_uri = f"#{node_to_sign.get('Id')}" if node_to_sign is not None else None
        
        # O Ambiente de Dados Nacional (ADN) utiliza criptografia moderna SHA256
        # CUIDADO: SEFAZ e RECEITA FEDERAL apenas suportam C14N 1.0 (20010315). O SignXML moderno defaults to C14N 1.1!
        signer = XMLSigner(
            method=methods.enveloped, 
            signature_algorithm="rsa-sha256", 
            digest_algorithm="sha256",
            c14n_algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"
        )
        
        # A API Nacional da Receita Federal rejeita estritamente qualquer tag com prefixo (E6155).
        # Devemos forçar o signxml a injetar as tags de assinatura no namespace padrão (sem prefixo 'ds:')
        signer.namespaces = {None: namespaces.ds}
        
        return signer.sign(xml_element, key=private_key, cert=[certificate], reference_uri=ref_uri)
