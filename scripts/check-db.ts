import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking course_settings table...");
    const { data: settings, error } = await supabase
        .from('course_settings')
        .select('*');

    if (error) {
        console.error("Error fetching settings:", error);
    } else {
        console.log("Settings found:", JSON.stringify(settings, null, 2));
    }

    console.log("\nChecking course_lessons table (is_locked column)...");
    const { data: lessons, error: lError } = await supabase
        .from('course_lessons')
        .select('id, title, is_locked')
        .limit(5);

    if (lError) {
        console.error("Error fetching lessons:", lError);
    } else {
        console.log("Lessons Sample:", JSON.stringify(lessons, null, 2));
    }
}

check();
