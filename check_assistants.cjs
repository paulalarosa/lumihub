const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('/Users/paulalarosa/Downloads/Site lumia v2/lumihub/.env.development', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(url.replace(/['"]/g, ''), key.replace(/['"]/g, ''));

async function check() {
  const { data: a, error: e1 } = await supabase.from('assistants').select('id, email, pin, access_pin');
  console.log('assistants:', a, e1);

  const { data: aa, error: e2 } = await supabase.from('assistant_access').select('*');
  console.log('assistant_access:', aa, e2);
}
check();
