import { createAdminClient } from "@/lib/supabase/server";
import { Changelog, CreateChangelogParams } from "./changelog-types";
import { createNotification } from "@/lib/notifications/notification-service";

export class ChangelogService {
    /**
     * Fetch all changelogs ordered by newest first
     */
    static async getChangelogs(includeAll = false): Promise<Changelog[]> {
        const supabase = await createAdminClient();
        let query = supabase
            .from('changelogs')
            .select('*')
            .order('created_at', { ascending: false });

        if (!includeAll) {
            query = query.eq('status', 'published');
        }

        const { data, error } = await query;

        if (error) {
            console.error('[ChangelogService] Error fetching changelogs:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Get the latest release
     */
    static async getLatestRelease(): Promise<Changelog | null> {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from('changelogs')
            .select('*')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) return null;
        return data;
    }

    /**
     * Create and publish a new release
     */
    static async publishRelease(params: CreateChangelogParams, adminIdentifier: string): Promise<{ success: boolean; data?: Changelog; error?: string }> {
        const supabase = await createAdminClient();

        const isDraft = params.status === 'draft';

        // 1. Insert changelog
        const { data, error } = await supabase
            .from('changelogs')
            .insert([{
                version: params.version,
                title: params.title,
                description: params.description,
                features: params.features || [],
                fixes: params.fixes || [],
                improvements: params.improvements || [],
                breaking_changes: params.breaking_changes || [],
                is_major: params.is_major || false,
                created_by: adminIdentifier,
                status: isDraft ? 'draft' : 'published',
                published_at: isDraft ? null : new Date().toISOString(),
            }])
            .select()
            .single();

        // If saved as draft, skip notifications
        if (isDraft) {
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true, data };
        }

        if (error) {
            console.error('[ChangelogService] Error publishing release:', error);
            return { success: false, error: error.message };
        }

        // 2. Broadcast notification to all users
        try {
            await createNotification({
                title: `✨ CPS Intern updated to ${params.version}`,
                message: params.title || 'See what\'s new in the latest update!',
                type: 'system',
                link: '/dashboard/updates',
                sound: 'success',
                icon: 'Rocket',
                priorityLevel: params.is_major ? 'IMPORTANT' : 'NORMAL',
                targetType: 'ALL',
                metadata: {
                    type: 'changelog_push',
                    version: params.version,
                    changelog_id: data.id
                }
            });
        } catch (nError) {
            console.warn('[ChangelogService] Failed to send broadcast notification:', nError);
        }

        return { success: true, data };
    }

    /**
     * Publish a draft changelog
     */
    static async publishDraft(changelogId: string): Promise<{ success: boolean; error?: string }> {
        const supabase = await createAdminClient();

        const { data, error } = await supabase
            .from('changelogs')
            .update({ status: 'published', published_at: new Date().toISOString() })
            .eq('id', changelogId)
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        // Send notification on publish
        try {
            await createNotification({
                title: `✨ CPS Intern updated to ${data.version}`,
                message: data.title || 'See what\'s new in the latest update!',
                type: 'system',
                link: '/dashboard/updates',
                sound: 'success',
                icon: 'Rocket',
                priorityLevel: data.is_major ? 'IMPORTANT' : 'NORMAL',
                targetType: 'ALL',
                metadata: {
                    type: 'changelog_push',
                    version: data.version,
                    changelog_id: data.id
                }
            });
        } catch (nError) {
            console.warn('[ChangelogService] Failed to send publish notification:', nError);
        }

        return { success: true };
    }

    /**
     * Update user's last seen version
     */
    static async markVersionAsSeen(userId: string, version: string): Promise<boolean> {
        const supabase = await createAdminClient();
        const { error } = await supabase
            .from('profiles')
            .update({ last_seen_version: version })
            .eq('id', userId);

        return !error;
    }
}
