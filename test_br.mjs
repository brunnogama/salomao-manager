import fetch from 'node-fetch';
const response = await fetch('https://brasilapi.com.br/api/cnpj/v1/29690984000161');
const data = await response.json();
console.log(data.uf);
