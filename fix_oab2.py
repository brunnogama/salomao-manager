import re

file_path = "/home/brunogama/Projetos/salomao-manager/src/components/finance/components/ListaVencimentosOAB.tsx"
with open(file_path, 'r') as f:
    content = f.read()

# Replace any lingering data_admissao with hire_date
content = content.replace("v.data_admissao", "v.hire_date")
content = content.replace("vencimento.data_admissao", "vencimento.hire_date")

with open(file_path, 'w') as f:
    f.write(content)
