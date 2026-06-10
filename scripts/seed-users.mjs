import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rgghncrnptfettqniswo.supabase.co';
const supabaseKey = 'sb_publishable_cTUcjd0ODH_mMYr0s97xtg_EPXFF8TD';

const supabase = createClient(supabaseUrl, supabaseKey);

const USERS = [
  {
    email: 'owner@gympro.com',
    password: 'Gym2025!',
    meta: { role: 'admin', nombre: 'Owner', apellido: 'GymPro' },
    label: 'Owner',
  },
  {
    email: 'admin1@gympro.com',
    password: 'Gym2025!',
    meta: { role: 'admin', nombre: 'Admin', apellido: 'Uno' },
    label: 'Admin 1',
  },
  {
    email: 'admin2@gympro.com',
    password: 'Gym2025!',
    meta: { role: 'admin', nombre: 'Admin', apellido: 'Dos' },
    label: 'Admin 2',
  },
  {
    email: 'alumno1@gympro.com',
    password: 'Gym2025!',
    meta: { role: 'alumno', nombre: 'Carlos', apellido: 'López' },
    label: 'Alumno 1',
  },
  {
    email: 'alumno2@gympro.com',
    password: 'Gym2025!',
    meta: { role: 'alumno', nombre: 'María', apellido: 'García' },
    label: 'Alumno 2',
  },
  {
    email: 'profesor1@gympro.com',
    password: 'Gym2025!',
    meta: { role: 'profesor', nombre: 'Lucas', apellido: 'Martínez' },
    label: 'Profesor 1',
  },
  {
    email: 'profesor2@gympro.com',
    password: 'Gym2025!',
    meta: { role: 'profesor', nombre: 'Sofía', apellido: 'Fernández' },
    label: 'Profesor 2',
  },
];

async function createUser({ email, password, meta, label }) {
  process.stdout.write(`Creando ${label} (${email})... `);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: meta },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('⚠️  ya existe');
    } else {
      console.log(`✗ error: ${error.message}`);
    }
    return;
  }

  console.log(`✓ creado (id: ${data.user?.id})`);
}

console.log('=== Seed de usuarios GymPro ===\n');
for (const user of USERS) {
  await createUser(user);
}
console.log('\nListo. Password de todos: Gym2025!');
console.log('\nNota: si Supabase requiere confirmación de email,');
console.log('desactivá "Confirm email" en Authentication > Settings,');
console.log('o confirmá manualmente en Authentication > Users.');
