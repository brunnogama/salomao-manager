from lxml import etree as ET
from signxml import XMLSigner

try:
    root = ET.Element('EnviarLoteRpsEnvio', xmlns="http://schemas.com")
    XMLSigner(method=XMLSigner.Methods.enveloped, signature_algorithm="rsa-sha1").sign(root, key=b"key", cert=b"cert")
except Exception as e:
    print("ERRO CAPTURADO:", repr(e))
