import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rgghncrnptfettqniswo.supabase.co';
const supabaseKey = 'sb_publishable_cTUcjd0ODH_mMYr0s97xtg_EPXFF8TD';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProfesor() {
  const userId = '2e391ae3-ca97-46bf-bd9c-f45deeaa72d5'; // The user ID we created

  const { error: insertError } = await supabase
    .from('profesores')
    .insert({
      user_id: userId,
      nombre: 'Profe',
      apellido: 'Prueba'
    });

  if (insertError) {
    console.error('Error insertando profesor:', insertError);
  } else {
    console.log('Profesor insertado con éxito en profesores!');
  }
}

fixProfesor();
