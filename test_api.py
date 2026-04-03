import urllib.request
import json
try:
    req = urllib.request.Request("https://brasilapi.com.br/api/cnpj/v1/29690984000161", headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        print(json.dumps(json.loads(response.read()), indent=2))
except Exception as e:
    print(e)
