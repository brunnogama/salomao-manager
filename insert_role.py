import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://iewevhdtwlviudetxgax.supabase.co/rest/v1/roles"
headers = {
    'apikey': '',
    'Authorization': 'Bearer ',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

data = {
    "name": "Auxiliar de RH"
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')

try:
    with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
        result = json.loads(response.read().decode())
        print(f"Role inserted successfully: {result}")
except urllib.error.HTTPError as e:
    # If the role already exists, might return 409 or similar.
    # Let's check existing roles first.
    print(f"HTTPError: {e.code} - {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error inserting role: {e}")
