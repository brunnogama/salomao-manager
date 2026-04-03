import urllib.request
import json

url = "https://iewevhdtwlviudetxgax.supabase.co/rest/v1/colaboradores?select=id,nome,cargo,status,data_admissao,equipe"
req = urllib.request.Request(url, headers={
    'apikey': '',
    'Authorization': 'Bearer '
})

try:
    with urllib.request.urlopen(req, timeout=10) as response:
        data = json.loads(response.read().decode())
        print(f"Total: {len(data)}")
        
        filtered = []
        for d in data:
            status = str(d.get('status') or '').lower()
            if 'ativ' not in status:
                continue
            cargo = str(d.get('cargo') or '').lower().replace('á', 'a').replace('ó', 'o').replace('í', 'i')
            if 'advogad' in cargo or 'socio' in cargo or 'socia' in cargo or 'estagiario' in cargo or 'estagiaria' in cargo or 'juridico' in cargo or 'legal' in cargo:
                filtered.append(d)
                
        print(f"Filtered (Ativos + Cargo): {len(filtered)}")
        if len(filtered) > 0:
            print(json.dumps(filtered[0:5], indent=2))
        else:
            print("Nenhum passou no filtro! Exemplo de ativos:")
            ativos = [d for d in data if 'ativ' in str(d.get('status')).lower()]
            print(json.dumps(ativos[0:5], indent=2))
            
except Exception as e:
    print(f"Erro: {e}")
