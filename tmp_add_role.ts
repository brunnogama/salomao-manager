import { supabase } from './src/lib/supabase';

async function main() {
  try {
    const roleName = 'Auxiliar de RH';
    
    // Check if role exists
    const { data: existingRoles, error: checkError } = await supabase
      .from('roles')
      .select('*')
      .ilike('name', roleName);
      
    if (checkError) {
      console.error('Error checking roles:', checkError);
      return;
    }
    
    if (existingRoles && existingRoles.length > 0) {
      console.log(`Role '${roleName}' already exists.`);
      return;
    }
    
    // Insert new role
    const { data: insertedRole, error: insertError } = await supabase
      .from('roles')
      .insert([{ name: roleName }])
      .select();
      
    if (insertError) {
      console.error('Error inserting role:', insertError);
      return;
    }
    
    console.log(`Successfully added role '${roleName}':`, insertedRole);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

main();
