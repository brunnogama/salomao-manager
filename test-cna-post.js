const no_cpf = "Alessandro Rodrigues de Lemos Paula Marques";

async function run() {
    const p1 = await fetch('https://cna.oab.org.br/');
    const p1t = await p1.text();
    const tokenMatch = p1t.match(/name="__RequestVerificationToken" type="hidden" value="([^"]+)"/);
    const token = tokenMatch ? tokenMatch[1] : '';

    const cookies = p1.headers.raw && p1.headers.raw()['set-cookie']
        ? p1.headers.raw()['set-cookie'].map(c => c.split(';')[0]).join('; ')
        : (p1.headers.get('set-cookie') || '')

    const data = new URLSearchParams();
    data.append('NomeAdvo', no_cpf);
    data.append('Insc', '');
    data.append('Uf', '');
    data.append('TipoInsc', 'Todos');
    data.append('IsMobile', 'false');
    if (token) data.append('__RequestVerificationToken', token);

    const res = await fetch('https://cna.oab.org.br/Home/Search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookies,
            'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            'X-Requested-With': 'XMLHttpRequest', // Often required by ASP.NET MVC for JSON response
        },
        body: data.toString()
    });

    const text = await res.text();
    console.log("Status:", res.status);
    console.log(text.substring(0, 1000));
}

run().catch(console.error);
