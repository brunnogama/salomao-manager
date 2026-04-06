from lxml import etree as ET
from datetime import datetime
import uuid

dps_id = f"DPS_{uuid.uuid4().hex}"
xml_template = f"""<DPS xmlns="http://www.sped.fazenda.gov.br/nfse" id="{dps_id}">
    <InfDPS Id="INF1">
        <tpAmb>1</tpAmb>
    </InfDPS>
</DPS>"""

parser = ET.XMLParser(remove_blank_text=True)
root = ET.fromstring(xml_template.encode('utf-8'), parser)

print("--- BEFORE SIGNXML (from string) ---")
print(ET.tostring(root, encoding='UTF-8', xml_declaration=True).decode('utf-8'))

# MOCK WHAT SIGNXML MIGHT DO (creating a new root)
new_root = ET.Element(root.tag, root.attrib)
for child in root:
    new_root.append(child)

print("\n--- AFTER FAKE SIGNXML REBUILD ---")
print(ET.tostring(new_root, encoding='UTF-8', xml_declaration=True).decode('utf-8'))
