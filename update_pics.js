import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// Load .env explicitly
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if(!supabaseUrl || !supabaseKey) {
   console.error("Missing ENV vars");
   process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const [partnerRes, colabRes] = await Promise.all([
    supabase.from('partners').select('id, name, photo_url'),
    supabase.from('collaborators').select('id, name, photo_url, foto_url')
  ]);
  
  const partners = partnerRes.data || [];
  const colabs = colabRes.data || [];
  
  const normalizeName = (name) => {
    if (!name) return '';
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  };

  let updatedCount = 0;
  for (const s of partners) {
      if (s.photo_url) continue;
      
      const normalizedPartnerName = normalizeName(s.name);
      
      let matchedColab = colabs.find(c => normalizeName(c.name) === normalizedPartnerName);
      
      if (!matchedColab) {
          const parts = normalizedPartnerName.split(' ').filter(p => p.length > 2);
          matchedColab = colabs.find(c => {
             const colabNormalized = normalizeName(c.name);
             if (!colabNormalized) return false;
             return parts.length >= 2 && colabNormalized.includes(parts[0]) && colabNormalized.includes(parts[parts.length - 1]);
          });
      }

      const finalUrl = matchedColab ? (matchedColab.photo_url || matchedColab.foto_url) : null;
      if (finalUrl) {
          console.log(`Setting photo for: ${s.name} -> ${finalUrl}`);
          const { error } = await supabase.from('partners').update({ photo_url: finalUrl }).eq('id', s.id);
          if (!error) updatedCount++;
      } else {
        console.log(`Missing for: ${s.name}`);
      }
  }
  console.log(`Copied ${updatedCount} URLs`);
  process.exit(0);
}
run();
