import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rgghncrnptfettqniswo.supabase.co';
const supabaseKey = 'sb_publishable_cTUcjd0ODH_mMYr0s97xtg_EPXFF8TD';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAlumno() {
  const email = 'alumno@test.com';
  const password = 'password123';

  console.log(`Intentando crear usuario alumno con email: ${email}`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'alumno'
      }
    }
  });

  if (error) {
    console.error('Error al crear usuario alumno:', error.message);
    return;
  }

  console.log('Usuario alumno creado con éxito.');
  console.log('ID:', data.user?.id);
  console.log('Email:', data.user?.email);
  console.log('Rol:', data.user?.user_metadata?.role);
}

createAlumno();
