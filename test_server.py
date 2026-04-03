from src.services.financeiro.signature_server import app
with app.test_client() as client:
    resp = client.post('/assinar-nota', data={
        'cidade': 'Rio de Janeiro',
        'prestador': '{"im": "123", "cnpj": "123"}',
        'tomador': '{"nome": "Nome", "cnpj": "12"}'
    })
    print(resp.status_code)
    print(resp.json)
