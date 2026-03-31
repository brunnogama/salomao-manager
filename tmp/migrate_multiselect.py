import os

filepath = r"c:\Users\MárcioGama\OneDrive - SALOMAO, KAIUCA & ABRAHAO SOCIEDADE DE ADVOGADOS\Área de Trabalho\Projetos\salomao-manager\src\components\collaborators\pages\Colaboradores.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
if 'SearchableMultiSelect' not in content:
    content = content.replace(
        "import { SearchableSelect } from '../../crm/SearchableSelect'",
        "import { SearchableSelect } from '../../crm/SearchableSelect'\nimport { SearchableMultiSelect } from '../../crm/SearchableMultiSelect'"
    )

# 2. Update safeCompare
old_safe_compare = """      const safeCompare = (filterVal: string, ...targetVals: (string | undefined | null)[]) => {
        if (!filterVal) return true;
        const lowFilter = filterVal.toLowerCase();
        return targetVals.some(t => t && String(t).toLowerCase() === lowFilter);
      };"""

new_safe_compare = """      const safeCompare = (filterVal: string, ...targetVals: (string | undefined | null)[]) => {
        if (!filterVal) return true;
        const filterItems = filterVal.split(',').map(f => f.trim().toLowerCase());
        return targetVals.some(t => {
          if (!t) return false;
          return filterItems.includes(String(t).toLowerCase());
        });
      };"""
content = content.replace(old_safe_compare, new_safe_compare)

# 3. Update safeIncludes
old_safe_includes = """      const safeIncludes = (filterVal: string, ...targetVals: (string | undefined | null)[]) => {
        if (!filterVal) return true;
        const lowFilter = filterVal.toLowerCase();
        return targetVals.some(t => t && String(t).toLowerCase().includes(lowFilter));
      };"""

new_safe_includes = """      const safeIncludes = (filterVal: string, ...targetVals: (string | undefined | null)[]) => {
        if (!filterVal) return true;
        const filterItems = filterVal.split(',').map(f => f.trim().toLowerCase());
        return targetVals.some(t => {
          if (!t) return false;
          const lowT = String(t).toLowerCase();
          return filterItems.some(f => lowT.includes(f));
        });
      };"""
content = content.replace(old_safe_includes, new_safe_includes)

# 4. Replace SearchableSelect to SearchableMultiSelect only in the advanced filters block
lines = content.split('\n')
for i, line in enumerate(lines):
    # Actually just replace between line 2500 and 2900 safely
    if 2500 < i < 2900:
        if '<SearchableSelect' in line:
            lines[i] = lines[i].replace('<SearchableSelect', '<SearchableMultiSelect')

content = '\n'.join(lines)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Migration completed successfully.")
