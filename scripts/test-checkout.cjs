const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envFiles = ['.env.local', '.env', '.env.development', '.env.production'];
const envVars = {};

envFiles.forEach(file => {
    try {
        const envPath = path.resolve(__dirname, '..', file);
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                    if (!envVars[key]) envVars[key] = value; // Don't overwrite if already set (priority to earlier files)
                }
            });
            console.log(`✅ Loaded ${file}`);
        }
    } catch (e) {
        // Ignore missing files
    }
});

const FUNCTION_BASE_URL = process.env.FUNCTION_BASE_URL || 'http://127.0.0.1:54321/functions/v1';
const SUPABASE_URL = envVars.SUPABASE_URL || envVars.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = envVars.SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
    console.error('❌ SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY) not found in .env files.');
    console.error('   Please run "npx supabase status" and add the Anon key to .env.local');
    process.exit(1);
}

console.log(`🌐 Testing Checkout Function at: ${FUNCTION_BASE_URL}`);

async function testCheckout() {
    console.log('\n💳 Testing create-checkout...');
    try {
        const res = await fetch(`${FUNCTION_BASE_URL}/create-checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                plan_type: 'pro',
                user_id: '00000000-0000-0000-0000-000000000000' // Test UUID, expected to fail User Lookup or Succeed if mocked
            })
        });

        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = text;
        }

        if (res.ok) {
            console.log('✅ Checkout Success:', data);
        } else {
            console.log('⚠️ Checkout Response (Expected Failure if User unavailable):', res.status, data);
        }
    } catch (err) {
        console.error('❌ Checkout Error:', err.message);
    }
}

testCheckout();
