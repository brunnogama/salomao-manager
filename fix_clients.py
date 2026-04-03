with open("src/components/controladoria/pages/Clients.tsx", "r") as f:
    content = f.read()

# Remove unused lucide-react imports
content = content.replace("  Mail,\n", "")
content = content.replace("  Phone,\n", "")
content = content.replace("  MapPin,\n", "")
content = content.replace("  X,\n", "")

# Remove maskPhone, createPortal, getGiftIconColor
content = content.replace("import { maskCNPJ, maskPhone } from '../utils/masks';", "import { maskCNPJ } from '../utils/masks';")
content = content.replace("import { createPortal } from 'react-dom';\n", "")
content = content.replace("import { getGiftIconColor } from '../../../types/crmContact';\n", "")

# Remove giftStats block
import re
block = re.search(r'// CRM: Calculate Gift Stats.*?return { giftStats: sortedStats, totalGifts: total };\s*\}, \[clients\]\);', content, re.DOTALL)
if block:
    content = content.replace(block.group(0), "// (Gift Stats foram removidos a pedido do usuário)")

with open("src/components/controladoria/pages/Clients.tsx", "w") as f:
    f.write(content)
