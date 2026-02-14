import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(url, key);

async function runMigration() {
    console.log("Applying migration for route appeals...");

    // We can't run raw SQL via the client easily, but we can try to add columns one by one
    // or use the 'rpc' if a custom function exists.
    // Since we might not have a custom function for raw SQL, let's try to just check the columns first.

    const { data, error } = await supabase.from('appeals').select('*').limit(1);
    if (error) {
        console.error("Error reading appeals table:", error);
    } else {
        console.log("Successfully connected to appeals table.");
        if (data && data.length > 0) {
            console.log("Sample record:", data[0]);
            if (!('appeal_type' in data[0])) {
                console.warn("WARNING: appeal_type column is MISSING!");
            } else {
                console.log("appeal_type column exists.");
            }
        } else {
            console.log("Table is empty, checking columns via query...");
            // Try to insert a dummy record and see if it fails on appeal_type
            const { error: insertError } = await supabase.from('appeals').insert({
                user_id: 'test',
                email: 'test@test.com',
                reason: 'test reason',
                appeal_type: 'suspension'
            }).select();

            if (insertError) {
                console.error("Insert test failed:", insertError);
            } else {
                console.log("Insert test succeeded! Column exists.");
            }
        }
    }
}

runMigration();
