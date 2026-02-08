// Profile Types for LinkedIn-Style Profile System

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    role: 'admin' | 'intern' | 'team_lead';
    headline: string | null;
    about: string | null;
    location: string | null;
    website: string | null;
    phone: string | null;
    department: string | null;
    username: string | null;
    open_to_work: boolean;
    creator_mode: boolean;
    profile_completed: boolean;
    resume_url: string | null;
    skills: string[];
    status: 'active' | 'suspended' | 'inactive';
    online_status: 'online' | 'idle' | 'offline';
    last_seen_at: string | null;
    total_points: number;
    joined_at: string;
    created_at: string;
    updated_at: string;
}

export interface Experience {
    id: string;
    profile_id: string;
    title: string;
    company: string;
    description: string | null;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    current: boolean;
    created_at: string;
    updated_at: string;
}

export interface Education {
    id: string;
    profile_id: string;
    school: string;
    degree: string | null;
    field: string | null;
    description: string | null;
    start_year: number | null;
    end_year: number | null;
    created_at: string;
    updated_at: string;
}

export interface ProfileSkill {
    id: string;
    profile_id: string;
    skill_name: string;
    endorsements_count: number;
    created_at: string;
}

export interface SkillEndorsement {
    id: string;
    skill_id: string;
    endorser_id: string;
    created_at: string;
    endorser?: {
        full_name: string;
        avatar_url: string | null;
    };
}

export interface Project {
    id: string;
    profile_id: string;
    title: string;
    description: string | null;
    media_url: string | null;
    thumbnail_url: string | null;
    link: string | null;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export interface Recommendation {
    id: string;
    profile_id: string;
    author_id: string | null;
    author_name: string;
    author_title: string | null;
    author_avatar_url: string | null;
    message: string;
    relationship: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export interface FeaturedItem {
    id: string;
    profile_id: string;
    item_type: 'link' | 'image' | 'video' | 'project' | 'certificate';
    title: string;
    description: string | null;
    media_url: string | null;
    link: string | null;
    display_order: number;
    created_at: string;
}

// Full profile with all related data
export interface FullProfile extends Profile {
    experiences: Experience[];
    education: Education[];
    skills: ProfileSkill[];
    projects: Project[];
    recommendations: Recommendation[];
    featured_items: FeaturedItem[];
}

// Profile completion calculation
export interface ProfileCompletion {
    percentage: number;
    sections: {
        photo: boolean;
        cover: boolean;
        headline: boolean;
        about: boolean;
        location: boolean;
        skills: boolean;
        experience: boolean;
        education: boolean;
    };
    isComplete: boolean; // >= 70%
}

// Form types for editing
export interface ProfileBasicForm {
    first_name: string;
    last_name: string;
    headline: string;
    location: string;
    phone: string;
    website: string;
    open_to_work: boolean;
}

export interface ExperienceForm {
    title: string;
    company: string;
    location: string;
    description: string;
    start_date: string;
    end_date: string;
    current: boolean;
}

export interface EducationForm {
    school: string;
    degree: string;
    field: string;
    description: string;
    start_year: number | null;
    end_year: number | null;
}

export interface ProjectForm {
    title: string;
    description: string;
    media_url: string;
    link: string;
    tags: string[];
}

export interface RecommendationRequest {
    recipientEmail: string;
    message: string;
    relationship: string;
}

// Common skill suggestions
export const COMMON_SKILLS = [
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js',
    'Python', 'Java', 'C++', 'SQL', 'MongoDB',
    'HTML', 'CSS', 'Tailwind CSS', 'Git', 'Docker',
    'AWS', 'Azure', 'Google Cloud', 'Firebase', 'Supabase',
    'REST APIs', 'GraphQL', 'Machine Learning', 'Data Analysis',
    'UI/UX Design', 'Figma', 'Adobe XD', 'Communication',
    'Team Leadership', 'Project Management', 'Agile', 'Scrum',
    'Problem Solving', 'Critical Thinking', 'Time Management'
];
