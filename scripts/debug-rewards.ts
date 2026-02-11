
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function dumpRewards() {
    const { data, error } = await supabase
        .from('reward_items')
        .select('*');

    if (error) {
        console.error('Error fetching rewards:', error);
        return;
    }

    console.log('REWARD_ITEMS_DUMP:');
    console.log(JSON.stringify(data, null, 2));
}

dumpRewards();
