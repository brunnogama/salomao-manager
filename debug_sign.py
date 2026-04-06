import traceback
from lxml import etree as ET
from cryptography.hazmat.primitives.asymmetric import rsa
from signxml import XMLSigner, methods, namespaces
import uuid

XMLSigner.check_deprecated_methods = lambda self: None

private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

dps_id = f"DPS_{uuid.uuid4().hex}"
xml_template = f"""<DPS xmlns="http://www.sped.fazenda.gov.br/nfse" id="{dps_id}">
    <InfDPS Id="INF1">
        <tpAmb>1</tpAmb>
    </InfDPS>
</DPS>"""

parser = ET.XMLParser(remove_blank_text=True)
root = ET.fromstring(xml_template.encode('utf-8'), parser)

try:
    signer = XMLSigner(method=methods.enveloped, signature_algorithm="rsa-sha1")
    # THE FIX
    signer.namespaces = {None: namespaces.ds}
    
    signed_root = signer.sign(root, key=private_key)
    print("--- SIGNED namespaces={None: namespaces.ds} ---")
    print(ET.tostring(signed_root, encoding='UTF-8').decode('utf-8'))
except Exception as e:
    traceback.print_exc()
