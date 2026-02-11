
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
    console.log('Migrating platform_settings...');

    // Since we don't have a direct SQL execution RPC (usually 'exec_sql' or similar),
    // and we can't use psql, we'll try to use a simple update to check if the column exists,
    // or we'll have to rely on the user to run the SQL if this fails.
    // However, sometimes projects have an 'exec_sql' function. Let's try to find if it exists.

    // Instead of assuming an RPC, let's try to add the column using a raw SQL if possible,
    // but supabase-js doesn't support raw SQL unless via RPC.

    // Plan B: Use the 'supabase' CLI if available? No, likely not.
    // Plan C: Since I can't run raw SQL, I'll inform the user if I can't do it.
    // But wait, I can try to use a trick if the project has a specific RPC.

    console.log('Checking if column exists...');
    const { data, error: selectError } = await supabase
        .from('platform_settings')
        .select('referral_system_enabled')
        .limit(1);

    if (selectError && selectError.code === '42703') {
        console.log('Column "referral_system_enabled" is missing. Attempting to create it via RPC if possible...');

        // Try to use a common RPC name for migrations if it exists
        const { error: rpcError } = await supabase.rpc('exec_sql', {
            sql_query: 'ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS referral_system_enabled BOOLEAN NOT NULL DEFAULT true;'
        });

        if (rpcError) {
            console.error('Failed to add column via RPC:', rpcError.message);
            console.log('\nACTUAL SQL TO RUN IN SUPABASE DASHBOARD:');
            console.log('ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS referral_system_enabled BOOLEAN NOT NULL DEFAULT true;');
        } else {
            console.log('Column added successfully via RPC.');
        }
    } else if (selectError) {
        console.error('Error checking column:', selectError.message);
    } else {
        console.log('Column "referral_system_enabled" already exists.');
    }
}

migrate();
