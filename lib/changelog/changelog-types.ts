export type ChangelogType = 'MAJOR' | 'MINOR' | 'PATCH';

export interface Changelog {
    id: string;
    version: string;
    title: string;
    description: string;
    features: string[];
    fixes: string[];
    improvements: string[];
    breaking_changes: string[];
    created_by: string;
    is_major: boolean;
    created_at: string;
}

export interface CreateChangelogParams {
    version: string;
    title: string;
    description: string;
    features?: string[];
    fixes?: string[];
    improvements?: string[];
    breaking_changes?: string[];
    is_major?: boolean;
}
