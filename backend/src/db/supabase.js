const { createClient } = require('@supabase/supabase-js');

// Sanitiza la URL: elimina /rest/v1/ si el usuario la copió completa desde el dashboard
let supabaseUrl = process.env.SUPABASE_URL || '';
supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Configura SUPABASE_URL y SUPABASE_SERVICE_KEY en el archivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

module.exports = { supabase };
