const https = require('https');

const SUPABASE_URL = 'https://iewevhdtwlviudetxgax.supabase.co';
const SUPABASE_KEY = '';

const options = {
  hostname: 'iewevhdtwlviudetxgax.supabase.co',
  path: '/rest/v1/candidatos?limit=1',
  method: 'GET',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(data);
  });
});
req.on('error', error => { console.error(error); });
req.end();
