import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rgghncrnptfettqniswo.supabase.co';
const supabaseKey = 'sb_publishable_cTUcjd0ODH_mMYr0s97xtg_EPXFF8TD';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@test.com',
    password: 'password123'
  });

  if (authError) {
    console.error('Auth Error:', authError.message);
    return;
  }
  
  console.log('User logged in:', authData.user.id);
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', authData.user.id);
    
  if (profileError) {
    console.error('Profile Error:', profileError);
  } else {
    console.log('Profiles found:', profile);
  }
}

checkUser();
