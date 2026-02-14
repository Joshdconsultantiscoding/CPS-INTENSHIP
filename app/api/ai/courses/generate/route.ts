// Course Generation API – POST
// Knowledge-aware course structure generation

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { generateCourse, saveCourseToDatabase } from '@/lib/ai/course-generator';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { prompt, save } = body;

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                { error: 'A course description prompt is required' },
                { status: 400 },
            );
        }

        // Generate the course structure
        const course = await generateCourse(prompt, user.id);

        // Optionally save to database
        if (save) {
            const result = await saveCourseToDatabase(course, user.id);
            if ('error' in result) {
                return NextResponse.json({
                    course,
                    saved: false,
                    error: result.error,
                });
            }

            return NextResponse.json({
                course,
                saved: true,
                courseId: result.courseId,
            });
        }

        return NextResponse.json({
            course,
            saved: false,
        });
    } catch (e: any) {
        console.error('[Course Gen API] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
