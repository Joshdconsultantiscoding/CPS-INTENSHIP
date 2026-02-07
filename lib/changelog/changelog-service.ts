import { createAdminClient } from "@/lib/supabase/server";
import { Changelog, CreateChangelogParams } from "./changelog-types";
import { createNotification } from "@/lib/notifications/notification-service";

export class ChangelogService {
    /**
     * Fetch all changelogs ordered by newest first
     */
    static async getChangelogs(): Promise<Changelog[]> {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from('changelogs')
            .select('*')
            .order('created_at', { ascending: false });

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
                created_by: adminIdentifier // This should be the profile UUID
            }])
            .select()
            .single();

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
