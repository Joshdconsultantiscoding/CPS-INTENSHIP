// Knowledge-Aware Course Generator
// Uses RAG to generate course structures aligned with institutional knowledge

import { searchGlobalKnowledge } from './vector-search';
import { generateAIResponse } from './model-adapter';
import { createAdminClient } from '@/lib/supabase/server';

export interface GeneratedCourse {
    title: string;
    description: string;
    level: string;
    duration_minutes: number;
    modules: GeneratedModule[];
    knowledgeReferences: string[];
}

export interface GeneratedModule {
    title: string;
    description: string;
    order_index: number;
    lessons: GeneratedLesson[];
}

export interface GeneratedLesson {
    title: string;
    content: string;
    duration_minutes: number;
    order_index: number;
}

/**
 * Generate a full course structure from a natural language description
 */
export async function generateCourse(
    prompt: string,
    triggeredBy: string,
): Promise<GeneratedCourse> {
    // Retrieve institutional knowledge for alignment
    const planChunks = await searchGlobalKnowledge(
        `internship plan structure curriculum ${prompt}`,
        5,
    );
    const qaChunks = await searchGlobalKnowledge(
        `learning guidelines expectations ${prompt}`,
        3,
    );

    const knowledgeContext = [
        ...planChunks.map(c => `[INTERNSHIP PLAN] ${c.content}`),
        ...qaChunks.map(c => `[Q&A GUIDELINES] ${c.content}`),
    ].join('\n\n');

    const systemPrompt = `You are a curriculum designer for a professional internship program. 
Generate course structures that align with institutional standards.

${knowledgeContext ? `INSTITUTIONAL KNOWLEDGE:\n${knowledgeContext}\n\n` : ''}
RULES:
- Course content must align with internship plan standards
- Ensure realistic progression from beginner to advanced
- Include practical exercises in every module
- Duration estimates must be reasonable
- Structure must support earning alignment (measurable outcomes)

Respond ONLY with valid JSON matching this structure:
{
  "title": "string",
  "description": "string",
  "level": "beginner|intermediate|advanced",
  "duration_minutes": number,
  "modules": [
    {
      "title": "string",
      "description": "string",
      "order_index": number,
      "lessons": [
        {
          "title": "string",
          "content": "detailed lesson content with instructions and exercises",
          "duration_minutes": number,
          "order_index": number
        }
      ]
    }
  ]
}`;

    const result = await generateAIResponse(
        [{ role: 'user', content: `Generate a course: ${prompt}` }],
        systemPrompt,
        'low'
    );

    let course: GeneratedCourse;
    try {
        // Try to extract JSON from the response (handle markdown code blocks)
        let jsonText = result.text.trim();
        const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) jsonText = jsonMatch[1].trim();

        course = JSON.parse(jsonText);
        course.knowledgeReferences = [
            ...planChunks.map(c => c.id),
            ...qaChunks.map(c => c.id),
        ];
    } catch (e) {
        console.error('[CourseGen] Failed to parse AI response:', e);
        throw new Error('Failed to generate course structure. Please try again with a more specific description.');
    }

    // Log the course generation
    try {
        const supabase = await createAdminClient();
        await supabase.from('ai_decision_logs').insert({
            action_type: 'course_generated',
            input_summary: prompt.slice(0, 500),
            output_summary: `Generated: ${course.title} (${course.modules?.length || 0} modules)`,
            full_response: JSON.stringify(course),
            source_chunk_ids: course.knowledgeReferences,
            authority_layers_used: ['Layer1:internship_plan', 'Layer1:qa_document'],
            triggered_by: triggeredBy,
            is_autonomous: false,
        });
    } catch (logError) {
        console.error('[CourseGen] Failed to log:', logError);
    }

    return course;
}

/**
 * Save a generated course to the database
 */
export async function saveCourseToDatabase(
    course: GeneratedCourse,
    createdBy: string,
): Promise<{ courseId: string } | { error: string }> {
    const supabase = await createAdminClient();

    // Insert the course
    const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
            title: course.title,
            description: course.description,
            level: course.level,
            duration_minutes: course.duration_minutes,
            is_published: false, // draft by default
            created_by: createdBy,
        })
        .select('id')
        .single();

    if (courseError || !courseData) {
        return { error: courseError?.message || 'Failed to create course' };
    }

    // Insert modules and lessons
    for (const mod of course.modules) {
        const { data: moduleData, error: moduleError } = await supabase
            .from('course_modules')
            .insert({
                course_id: courseData.id,
                title: mod.title,
                description: mod.description,
                order_index: mod.order_index,
            })
            .select('id')
            .single();

        if (moduleError || !moduleData) continue;

        // Insert lessons for this module
        const lessonInserts = mod.lessons.map(lesson => ({
            module_id: moduleData.id,
            course_id: courseData.id,
            title: lesson.title,
            content: lesson.content,
            duration_minutes: lesson.duration_minutes,
            order_index: lesson.order_index,
        }));

        if (lessonInserts.length > 0) {
            await supabase.from('course_lessons').insert(lessonInserts);
        }
    }

    return { courseId: courseData.id };
}
