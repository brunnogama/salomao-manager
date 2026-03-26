import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iewevhdtwlviudetxgax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld2V2aGR0d2x2aXVkZXR4Z2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTMxNzEsImV4cCI6MjA4MzEyOTE3MX0.jQr91dNKSrwypja7UoDnv8oiE29L_dpy-mPQ_3vW5Sw';
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
