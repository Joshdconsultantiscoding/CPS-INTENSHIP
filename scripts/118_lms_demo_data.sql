-- =============================================
-- LMS DEMO DATA SEED
-- Run this after 117_lms_quiz_system.sql
-- =============================================
-- Create Demo Course
INSERT INTO public.courses (
        id,
        title,
        description,
        level,
        duration_minutes,
        is_published,
        assignment_type,
        enable_time_tracking
    )
VALUES (
        'd0000000-0000-0000-0000-000000000001',
        'Introduction to Cospronos Media',
        'Learn the fundamentals of media production, content creation, and professional communication. This comprehensive course covers essential skills for success in the modern media industry.',
        'beginner',
        120,
        true,
        'global',
        true
    ) ON CONFLICT (id) DO NOTHING;
-- Module 1: Getting Started
INSERT INTO public.course_modules (
        id,
        course_id,
        title,
        description,
        order_index
    )
VALUES (
        'd0000000-0000-0000-0000-000000000011',
        'd0000000-0000-0000-0000-000000000001',
        'Getting Started',
        'Introduction to the platform and basic concepts',
        1
    ) ON CONFLICT (id) DO NOTHING;
-- Module 2: Core Skills
INSERT INTO public.course_modules (
        id,
        course_id,
        title,
        description,
        order_index
    )
VALUES (
        'd0000000-0000-0000-0000-000000000012',
        'd0000000-0000-0000-0000-000000000001',
        'Core Skills',
        'Essential skills for media professionals',
        2
    ) ON CONFLICT (id) DO NOTHING;
-- Lesson 1: Welcome
INSERT INTO public.course_lessons (
        id,
        module_id,
        title,
        content,
        duration_minutes,
        required_time_seconds,
        order_index,
        allow_skip
    )
VALUES (
        'd0000000-0000-0000-0000-000000000101',
        'd0000000-0000-0000-0000-000000000011',
        'Welcome to Cospronos Media',
        '<h2>Welcome!</h2><p>Welcome to Cospronos Media training program. This course will teach you the essential skills needed to excel in media production and content creation.</p><h3>What You Will Learn</h3><ul><li>Understanding media production workflows</li><li>Content creation best practices</li><li>Professional communication skills</li><li>Quality assurance techniques</li></ul><h3>Course Structure</h3><p>This course is divided into modules, each containing lessons and quizzes to test your knowledge. Make sure to complete each lesson before moving on to the next.</p><p><strong>Time Tracking:</strong> This course tracks your learning time to ensure thorough understanding of the material.</p>',
        15,
        300,
        1,
        false
    ) ON CONFLICT (id) DO NOTHING;
-- Lesson 2: Media Fundamentals
INSERT INTO public.course_lessons (
        id,
        module_id,
        title,
        content,
        duration_minutes,
        required_time_seconds,
        order_index,
        allow_skip
    )
VALUES (
        'd0000000-0000-0000-0000-000000000102',
        'd0000000-0000-0000-0000-000000000011',
        'Media Fundamentals',
        '<h2>Understanding Media Production</h2><p>Media production encompasses all the processes involved in creating content for various platforms including video, audio, and written content.</p><h3>Key Concepts</h3><ol><li><strong>Pre-production:</strong> Planning, scripting, and preparation</li><li><strong>Production:</strong> The actual creation process</li><li><strong>Post-production:</strong> Editing, quality checks, and finalization</li></ol><h3>Quality Standards</h3><p>At Cospronos Media, we maintain high quality standards:</p><ul><li>Accuracy in all content</li><li>Professional presentation</li><li>Timely delivery</li><li>Client satisfaction</li></ul>',
        20,
        600,
        2,
        false
    ) ON CONFLICT (id) DO NOTHING;
-- Lesson 3: Professional Communication
INSERT INTO public.course_lessons (
        id,
        module_id,
        title,
        content,
        duration_minutes,
        required_time_seconds,
        order_index,
        allow_skip
    )
VALUES (
        'd0000000-0000-0000-0000-000000000103',
        'd0000000-0000-0000-0000-000000000012',
        'Professional Communication',
        '<h2>Effective Communication</h2><p>Communication is the foundation of successful media production. This lesson covers essential communication skills.</p><h3>Written Communication</h3><ul><li>Clear and concise writing</li><li>Proper grammar and spelling</li><li>Appropriate tone for the audience</li></ul><h3>Verbal Communication</h3><ul><li>Active listening</li><li>Clear articulation</li><li>Professional vocabulary</li></ul><h3>Digital Communication</h3><ul><li>Email etiquette</li><li>Video conferencing best practices</li><li>Collaboration tool usage</li></ul>',
        25,
        900,
        1,
        false
    ) ON CONFLICT (id) DO NOTHING;
-- Quiz 1: Module 1 Assessment (after getting started)
INSERT INTO public.quizzes (
        id,
        title,
        description,
        course_id,
        module_id,
        lesson_id,
        attachment_level,
        time_limit_seconds,
        passing_score,
        attempts_allowed,
        randomize_questions,
        show_correct_answers,
        show_explanations,
        strict_mode,
        fullscreen_required,
        detect_tab_switch,
        is_published
    )
VALUES (
        'd0000000-0000-0000-0000-000000000201',
        'Getting Started Quiz',
        'Test your understanding of the introductory material',
        'd0000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000011',
        'd0000000-0000-0000-0000-000000000102',
        'lesson',
        600,
        70,
        3,
        true,
        true,
        true,
        false,
        false,
        true,
        true
    ) ON CONFLICT (id) DO NOTHING;
-- Quiz 1 Questions
INSERT INTO public.quiz_questions (
        id,
        quiz_id,
        type,
        question_text,
        options,
        correct_answers,
        explanation,
        points,
        order_index
    )
VALUES (
        'd0000000-0000-0000-0000-000000000301',
        'd0000000-0000-0000-0000-000000000201',
        'mcq',
        'What are the three main phases of media production?',
        '["Pre-production, Production, Post-production", "Planning, Creating, Publishing", "Writing, Recording, Editing", "Research, Development, Launch"]',
        '["Pre-production, Production, Post-production"]',
        'Media production follows three main phases: Pre-production (planning), Production (creation), and Post-production (editing and finalization).',
        10,
        1
    ),
    (
        'd0000000-0000-0000-0000-000000000302',
        'd0000000-0000-0000-0000-000000000201',
        'boolean',
        'Time tracking is enabled for this course to ensure thorough understanding.',
        '["True", "False"]',
        '["True"]',
        'This course uses time tracking to monitor learning engagement.',
        10,
        2
    ),
    (
        'd0000000-0000-0000-0000-000000000303',
        'd0000000-0000-0000-0000-000000000201',
        'multi_select',
        'Which of the following are quality standards at Cospronos Media? (Select all that apply)',
        '["Accuracy in content", "Professional presentation", "Minimum effort", "Timely delivery", "Client satisfaction"]',
        '["Accuracy in content", "Professional presentation", "Timely delivery", "Client satisfaction"]',
        'Cospronos Media maintains high standards including accuracy, professional presentation, timely delivery, and client satisfaction.',
        15,
        3
    ),
    (
        'd0000000-0000-0000-0000-000000000304',
        'd0000000-0000-0000-0000-000000000201',
        'short_answer',
        'What phase of production involves editing and quality checks?',
        '[]',
        '["Post-production", "post-production", "Post production", "post production"]',
        'Post-production is the phase where editing, quality checks, and finalization occur.',
        15,
        4
    ) ON CONFLICT (id) DO NOTHING;
-- Quiz 2: Final Assessment (Strict Mode)
INSERT INTO public.quizzes (
        id,
        title,
        description,
        course_id,
        module_id,
        lesson_id,
        attachment_level,
        time_limit_seconds,
        passing_score,
        attempts_allowed,
        randomize_questions,
        randomize_options,
        show_correct_answers,
        show_explanations,
        strict_mode,
        fullscreen_required,
        detect_tab_switch,
        auto_submit_on_cheat,
        is_published
    )
VALUES (
        'd0000000-0000-0000-0000-000000000202',
        'Final Course Assessment',
        'Comprehensive assessment covering all course material. Strict mode enabled.',
        'd0000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000012',
        'd0000000-0000-0000-0000-000000000103',
        'lesson',
        900,
        75,
        2,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        false,
        true
    ) ON CONFLICT (id) DO NOTHING;
-- Quiz 2 Questions
INSERT INTO public.quiz_questions (
        id,
        quiz_id,
        type,
        question_text,
        options,
        correct_answers,
        explanation,
        points,
        order_index
    )
VALUES (
        'd0000000-0000-0000-0000-000000000311',
        'd0000000-0000-0000-0000-000000000202',
        'mcq',
        'What is the foundation of successful media production according to the course?',
        '["Technology", "Communication", "Equipment", "Budget"]',
        '["Communication"]',
        'The course emphasizes that communication is the foundation of successful media production.',
        10,
        1
    ),
    (
        'd0000000-0000-0000-0000-000000000312',
        'd0000000-0000-0000-0000-000000000202',
        'boolean',
        'Active listening is part of verbal communication skills.',
        '["True", "False"]',
        '["True"]',
        'Active listening is a key component of effective verbal communication.',
        10,
        2
    ),
    (
        'd0000000-0000-0000-0000-000000000313',
        'd0000000-0000-0000-0000-000000000202',
        'multi_select',
        'Which are examples of digital communication covered in the course? (Select all that apply)',
        '["Email etiquette", "Video conferencing", "Smoke signals", "Collaboration tools", "Telepathy"]',
        '["Email etiquette", "Video conferencing", "Collaboration tools"]',
        'Digital communication includes email etiquette, video conferencing best practices, and collaboration tool usage.',
        15,
        3
    ),
    (
        'd0000000-0000-0000-0000-000000000314',
        'd0000000-0000-0000-0000-000000000202',
        'mcq',
        'What does pre-production involve?',
        '["Editing and review", "Planning, scripting, and preparation", "Publishing content", "Client meetings only"]',
        '["Planning, scripting, and preparation"]',
        'Pre-production is the planning phase that includes scripting and preparation.',
        10,
        4
    ),
    (
        'd0000000-0000-0000-0000-000000000315',
        'd0000000-0000-0000-0000-000000000202',
        'short_answer',
        'What type of communication involves clear and concise writing?',
        '[]',
        '["Written communication", "written communication", "Written", "written"]',
        'Written communication requires clear and concise writing with proper grammar.',
        15,
        5
    ),
    (
        'd0000000-0000-0000-0000-000000000316',
        'd0000000-0000-0000-0000-000000000202',
        'boolean',
        'This quiz has strict mode enabled, requiring fullscreen.',
        '["True", "False"]',
        '["True"]',
        'This final assessment uses strict mode with fullscreen requirement for integrity.',
        10,
        6
    ) ON CONFLICT (id) DO NOTHING;
-- Enable course settings
INSERT INTO public.course_settings (
        course_id,
        lock_next_until_previous,
        certificate_on_completion,
        min_score_for_certificate
    )
VALUES (
        'd0000000-0000-0000-0000-000000000001',
        true,
        true,
        70
    ) ON CONFLICT (course_id) DO NOTHING;