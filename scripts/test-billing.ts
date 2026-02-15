import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadEnvAndRun() {
    // Load .env manually to map variables
    const envPath = path.resolve(__dirname, '../.env');
    console.log(`📂 Loading .env from: ${envPath}`);

    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf-8');
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim(); // Handle values with =
                if (key && value && !key.startsWith('#')) {
                    process.env[key] = value;
                }
            }
        });
    }

    // Map VITE vars to Process vars expected by billing.ts
    process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    console.log('🧪 Starting Billing Webhook Audit Test...');
    console.log(`Endpoint: ${process.env.SUPABASE_URL}`);

    // Dynamic import to ensure process.env is set BEFORE module load
    const { handleBillingWebhook } = await import('../src/api/webhooks/billing.ts');
    const { createClient } = await import('@supabase/supabase-js');

    // Create client to fetch a real user for the test
    const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

    console.log('🔍 Fetching a valid user ID for testing...');
    const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
    const validUserId = profile?.id || null; // Use real ID or null to avoid FK violation

    console.log(`👤 Using User ID: ${validUserId || 'NULL (Foreign Key skip)'}`);

    // Mock Event: Checkout Session Completed
    const mockEvent = {
        type: 'checkout.session.completed',
        data: {
            object: {
                id: 'evt_test_audit_verify',
                subscription: 'sub_test_audit_verify',
                customer: 'cus_test_audit_verify',
                metadata: {
                    user_id: validUserId
                }
            }
        }
    };

    console.log('📤 Sending Mock Event:', JSON.stringify(mockEvent.type));

    try {
        const result = await handleBillingWebhook(mockEvent as any);
        console.log('📥 Result:', result);

        if (result.received) {
            console.log('✅ Webhook processed successfully.');
            console.log('⚠️ CHECK DATABASE: Look for "audit_logs" entry where source="STRIPE_WEBHOOK"');
        } else {
            console.error('❌ Webhook failed:', result);
        }

    } catch (error) {
        console.error('🔥 Test execution failed:', error);
    }
}

loadEnvAndRun();
