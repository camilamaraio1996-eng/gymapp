import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rgghncrnptfettqniswo.supabase.co';
const supabaseKey = 'sb_publishable_cTUcjd0ODH_mMYr0s97xtg_EPXFF8TD';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createProfesor() {
  const email = 'profesor@test.com';
  const password = 'password123';

  console.log(`Intentando crear usuario profesor con email: ${email}`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'profesor'
      }
    }
  });

  if (error) {
    console.error('Error al crear usuario:', error.message);
    return;
  }

  console.log('Usuario profesor creado con éxito.');
  console.log('ID:', data.user?.id);
  console.log('Email:', data.user?.email);
  console.log('Rol:', data.user?.user_metadata?.role);
  
  // Opcional: Insertar en la tabla profiles si es necesario y las políticas de RLS lo permiten.
  // Muchas veces hay un trigger en la DB que lo hace automáticamente.
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'profesor' })
    .eq('user_id', data.user.id);
    
  if (profileError) {
    console.log('Nota: No se pudo actualizar el perfil manualmente, es posible que el trigger lo maneje o RLS lo impida:', profileError.message);
  } else {
    console.log('Perfil actualizado con rol de profesor.');
  }
}

createProfesor();
