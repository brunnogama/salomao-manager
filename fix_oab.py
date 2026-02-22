import re

file_path = "/home/brunogama/Projetos/salomao-manager/src/components/finance/components/ListaVencimentosOAB.tsx"
with open(file_path, 'r') as f:
    content = f.read()

# Fields update
content = content.replace("v.data_admissao", "v.hire_date")
content = content.replace("v.status", "v.status")
content = content.replace("v.cargo", "v.role")
content = content.replace("v.nome", "v.name")
content = content.replace("v.oab_numero", "v.oab_number")

# In the map return
content = re.sub(r'nome: string', r'name: string', content)
content = re.sub(r'cargo: string', r'role: string', content)
content = re.sub(r'data_admissao: string', r'hire_date: string', content)
content = re.sub(r'oab_numero: string', r'oab_number: string', content)

content = content.replace("vencimento.nome", "vencimento.name")
content = content.replace("vencimento.cargo", "vencimento.role")
content = content.replace("vencimento.data_admissao", "vencimento.hire_date")
content = content.replace("vencimento.oab_numero", "vencimento.oab_number")

with open(file_path, 'w') as f:
    f.write(content)
