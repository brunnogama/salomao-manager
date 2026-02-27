const nome = "Alessandro Rodrigues de Lemos Paula Marques";
const soapUrl = 'https://www5.oab.org.br/cnaws/service.asmx';
const soapAction = 'http://tempuri.org/ConsultaAdvogado';

const soapBody = `
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ConsultaAdvogado xmlns="http://tempuri.org/">
      <cpf></cpf>
      <nome>${nome}</nome>
      <uf></uf>
      <tipoInscricao></tipoInscricao>
    </ConsultaAdvogado>
  </soap:Body>
</soap:Envelope>
`;

async function test() {
    try {
        const response = await fetch(soapUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': soapAction,
            },
            body: soapBody,
        });

        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Response:", text);
    } catch (err) {
        console.error(err);
    }
}

test();
