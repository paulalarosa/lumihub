const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('/Users/paulalarosa/Downloads/Site lumia v2/lumihub/.env.development', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(url.replace(/['"]/g, ''), key.replace(/['"]/g, ''));

async function check() {
  const { data, error } = await supabase.rpc('verify_assistant_login', {
    p_email: 'paula_larosa@hotmail.com',
    p_pin: '7870'
  });
  console.log('RPC result:', data, error);
}
check();
