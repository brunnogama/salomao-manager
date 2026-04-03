import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://iewevhdtwlviudetxgax.supabase.co/rest/v1/collaborators?select=id,name,role,status,hire_date,equipe,oab_number,oab_uf"
req = urllib.request.Request(url, headers={
    'apikey': '',
    'Authorization': 'Bearer '
})

data = []
try:
    with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
        data = json.loads(response.read().decode())
        ativos = [d for d in data if d.get('status') and 'ativ' in str(d.get('status')).lower()]
        print(f"Ativos found: {len(ativos)}")
        if len(ativos) > 0:
            print("SAMPLE ROW:")
            print(json.dumps(ativos[0], indent=2))
except Exception as e:
    print(f"Error fetching collaborators: {e}")

url_roles = "https://iewevhdtwlviudetxgax.supabase.co/rest/v1/roles?select=id,name"
req_roles = urllib.request.Request(url_roles, headers={
    'apikey': '',
    'Authorization': 'Bearer '
})
try:
    with urllib.request.urlopen(req_roles, context=ctx, timeout=10) as response:
        roles = json.loads(response.read().decode())
        print(f"Roles found: {len(roles)}")
        if len(roles) > 0:
            print(json.dumps(roles[0:3], indent=2))
except Exception as e:
    print(f"Error fetching roles: {e}")
