import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rgghncrnptfettqniswo.supabase.co';
const supabaseKey = 'sb_publishable_cTUcjd0ODH_mMYr0s97xtg_EPXFF8TD';

const supabase = createClient(supabaseUrl, supabaseKey);

const email = 'admin@test.com';
const password = 'password123';

async function createAdmin() {
  console.log(`Intentando crear admin: ${email}`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'admin',
        nombre: 'Admin',
        apellido: 'GymPro',
      },
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('Usuario ya existe. Verificando metadata...');
      await checkAndFixAdmin();
    } else {
      console.error('Error al crear:', error.message);
    }
    return;
  }

  console.log('Admin creado con éxito.');
  console.log('ID:', data.user?.id);
  console.log('Rol en metadata:', data.user?.user_metadata?.role);
  console.log('\nSi Supabase requiere confirmación de email, verificá la casilla o desactivá "Confirm email" en Authentication > Settings.');
}

async function checkAndFixAdmin() {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('No se pudo iniciar sesión:', error.message);
    return;
  }

  const meta = data.user?.user_metadata;
  console.log('Metadata actual:', JSON.stringify(meta, null, 2));

  if (meta?.role === 'admin') {
    console.log('✓ El usuario ya tiene role=admin en metadata. El login debería funcionar.');
  } else {
    console.log('✗ El usuario NO tiene role=admin en metadata.');
    console.log('Para corregirlo, ejecutá en el SQL Editor de Supabase:');
    console.log(`UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'::jsonb WHERE email = '${email}';`);
  }
}

createAdmin();
