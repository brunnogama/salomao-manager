async function test() {
    try {
        const res = await fetch("https://iewevhdtwlviudetxgax.supabase.co/functions/v1/consultar-cna", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome: "Alessandro Rodrigues de Lemos Paula Marques"
            })
        });

        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch (e) {
        console.error(e);
    }
}
test();
