import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iewevhdtwlviudetxgax.supabase.co';
const supabaseKey = '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateContractTypes() {
  console.log("Fetching roles...");
  const { data: roles, error: rolesError } = await supabase.from('roles').select('id, name');
  if (rolesError) {
    console.error("Error fetching roles:", rolesError);
    return;
  }

  const matchingRoles = roles.filter(r => {
    if(!r.name) return false;
    const lowerName = r.name.toLowerCase();
    return lowerName.includes('advogad') || 
           lowerName.includes('sóci') || 
           lowerName.includes('soci') || 
           lowerName.includes('consultor');
  });

  const targetRoleIds = matchingRoles.map(r => r.id);

  console.log("Target roles:");
  matchingRoles.forEach(r => console.log(`- ${r.name} (${r.id})`));

  if (targetRoleIds.length === 0) {
    console.log("No matching roles found.");
    return;
  }

  console.log(`\nUpdating collaborators with ${targetRoleIds.length} roles...`);
  const { data: updated, error: updateError } = await supabase
    .from('collaborators')
    .update({ contract_type: 'ADVOGADO ASSOCIADO' })
    .in('role', targetRoleIds)
    .select('id, name');

  if (updateError) {
    console.error("Error updating collaborators:", updateError);
    return;
  }

  console.log(`Update successful. Records affected: ${updated.length}`);
}

updateContractTypes();
