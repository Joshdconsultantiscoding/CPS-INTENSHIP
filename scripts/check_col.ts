
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    console.log('Attempting to add column referral_system_enabled to platform_settings...');
    // We try to update a non-existent row to see if the column exists
    const { error } = await s.from('platform_settings').select('referral_system_enabled').limit(1);

    if (error) {
        console.log('Column might be missing, error:', error.message);
        console.log('Please run the SQL manually or check if the table exists.');
    } else {
        console.log('Column referral_system_enabled exists.');
    }
}

main();
