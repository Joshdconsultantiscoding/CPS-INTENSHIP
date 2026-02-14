import { createAdminClient } from "@/lib/supabase/server";

export interface Appeal {
    id: string;
    user_id: string;
    email: string | null;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'ignored';
    appeal_type: 'suspension' | 'route_block';
    target_route: string | null;
    admin_notes: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    created_at: string;
}

export class AppealsService {
    static async createAppeal(userId: string, email: string, reason: string, type: 'suspension' | 'route_block' = 'suspension', targetRoute?: string) {
        const supabase = await createAdminClient();

        // Check if there is already a pending appeal of the SAME type/route
        const query = supabase
            .from("appeals")
            .select("id")
            .eq("user_id", userId)
            .eq("status", "pending")
            .eq("appeal_type", type);

        if (targetRoute) {
            query.eq("target_route", targetRoute);
        }

        const { data: existing, error: checkError } = await query.maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error("Error checking existing appeals:", checkError);
            return { success: false, error: `Database error: ${checkError.message}` };
        }

        if (existing) {
            return { success: false, error: "You already have a pending appeal for this request." };
        }

        const { error } = await supabase.from("appeals").insert({
            user_id: userId,
            email,
            reason,
            appeal_type: type,
            target_route: targetRoute
        });

        if (error) {
            console.error("Error creating appeal:", error);
            const detail = error.message || error.details || "Unknown database error";
            return { success: false, error: `Failed to submit appeal: ${detail}` };
        }

        return { success: true };
    }

    static async getAppeals() {
        const supabase = await createAdminClient();

        // Fetch appeals first
        const { data: appeals, error } = await supabase
            .from("appeals")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching appeals:", error);
            return [];
        }

        if (!appeals || appeals.length === 0) return [];

        // Manual join to ensure we get user data regardless of FK alias issues
        const userIds = appeals.map(a => a.user_id);
        const { data: users } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, email")
            .in("id", userIds);

        const userMap = new Map(users?.map(u => [u.id, u]) || []);

        return appeals.map(appeal => ({
            ...appeal,
            user: userMap.get(appeal.user_id) || { full_name: 'Unknown User', email: appeal.email, avatar_url: null }
        }));
    }

    static async reviewAppeal(appealId: string, adminId: string, status: 'approved' | 'rejected' | 'ignored', notes?: string) {
        const supabase = await createAdminClient();

        const updates: any = {
            status,
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            admin_notes: notes
        };

        const { error } = await supabase
            .from("appeals")
            .update(updates)
            .eq("id", appealId);

        if (error) {
            console.error("Error updating appeal:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    }

    static async getAppealStatus(userId: string) {
        const supabase = await createAdminClient();

        const { data, error } = await supabase
            .from("appeals")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            return null;
        }

        return data;
    }

    static async getAppealById(appealId: string) {
        const supabase = await createAdminClient();
        const { data } = await supabase
            .from("appeals")
            .select("*")
            .eq("id", appealId)
            .single();
        return data;
    }
}
