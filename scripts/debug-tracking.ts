import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log("--- Debugging startLessonTracking ---");

    // 1. Get a sample lesson and user to test with
    console.log("Fetching sample data...");
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    const { data: lessons } = await supabase.from('course_lessons').select('id, course_modules(course_id)').limit(1);

    if (!profiles?.[0] || !lessons?.[0]) {
        console.error("Missing sample data to test with.");
        return;
    }

    const userId = profiles[0].id;
    const lessonId = lessons[0].id;
    const courseId = (lessons[0].course_modules as any)?.course_id;

    console.log(`Testing with: User=${userId}, Lesson=${lessonId}, Course=${courseId}`);

    // 2. Try the upsert that's failing
    const now = new Date().toISOString();
    console.log("Attempting upsert...");
    const { data, error } = await supabase
        .from("lesson_time_tracking")
        .upsert({
            user_id: userId,
            lesson_id: lessonId,
            course_id: courseId,
            first_accessed_at: now,
            last_accessed_at: now,
            current_session_start: now,
            is_paused: false
        }, {
            onConflict: "user_id,lesson_id",
            ignoreDuplicates: false
        })
        .select()
        .single();

    if (error) {
        console.error("UPSERT FAILED!");
        console.error("Error Details:", JSON.stringify(error, null, 2));
    } else {
        console.log("UPSERT SUCCESS!");
        console.log("Returned Data:", JSON.stringify(data, null, 2));
    }

    // 3. Inspect table columns
    console.log("\nTable structure (via RPC or direct query if possible)...");
    // Since we can't run psql, let's just try to select all columns from one row if it exists
    const { data: row } = await supabase.from('lesson_time_tracking').select('*').limit(1);
    if (row && row.length > 0) {
        console.log("Columns present in existing row:", Object.keys(row[0]));
    } else {
        console.log("No rows in lesson_time_tracking to inspect columns.");
    }
}

debug();
