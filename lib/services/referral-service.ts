import { createAdminClient } from "@/lib/supabase/server";

/**
 * ReferralService — Server-side referral engine.
 * Handles code generation, referral tracking, points, leaderboard, and redemption.
 */
export class ReferralService {
    /**
     * Generate a unique 8-character alphanumeric referral code.
     */
    private static generateCode(): string {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No 0/O/1/I for clarity
        let code = "";
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Get or create a referral code for a user.
     */
    static async getOrCreateReferralCode(userId: string): Promise<string> {
        const supabase = await createAdminClient();

        // Check existing
        const { data: existing } = await supabase
            .from("referral_codes")
            .select("code")
            .eq("user_id", userId)
            .maybeSingle();

        if (existing?.code) return existing.code;

        // Generate unique code with retry
        let attempts = 0;
        while (attempts < 5) {
            const code = this.generateCode();
            const { error } = await supabase
                .from("referral_codes")
                .insert({ user_id: userId, code });

            if (!error) return code;
            if (error.code !== "23505") throw error; // Only retry on unique violation
            attempts++;
        }

        throw new Error("Failed to generate unique referral code after 5 attempts");
    }

    /**
     * Process a referral when a new user signs up with a referral code.
     * Returns { success, error? }
     */
    static async processReferral(
        referredId: string,
        code: string,
        ipAddress?: string
    ): Promise<{ success: boolean; error?: string }> {
        const supabase = await createAdminClient();

        // 1. Find the referral code
        const { data: refCode } = await supabase
            .from("referral_codes")
            .select("user_id")
            .eq("code", code.toUpperCase())
            .maybeSingle();

        if (!refCode) return { success: false, error: "Invalid referral code" };

        const referrerId = refCode.user_id;

        // 2. Prevent self-referral
        if (referrerId === referredId) {
            return { success: false, error: "Cannot refer yourself" };
        }

        // 3. Check if already referred
        const { data: existingRef } = await supabase
            .from("referrals")
            .select("id")
            .eq("referred_id", referredId)
            .maybeSingle();

        if (existingRef) {
            return { success: false, error: "User already has a referral" };
        }

        // 4. IP-based rate limiting (max 5 referrals per IP per day)
        if (ipAddress) {
            const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
            const { count } = await supabase
                .from("referrals")
                .select("id", { count: "exact", head: true })
                .eq("ip_address", ipAddress)
                .gte("created_at", oneDayAgo);

            if (count && count >= 5) {
                return { success: false, error: "Too many referrals from this location" };
            }
        }

        // 5. Create referral record
        const { error: refError } = await supabase.from("referrals").insert({
            referrer_id: referrerId,
            referred_id: referredId,
            status: "confirmed",
            ip_address: ipAddress || null,
            confirmed_at: new Date().toISOString(),
        });

        if (refError) {
            console.error("[ReferralService] Insert referral error:", refError);
            return { success: false, error: refError.message };
        }

        // 6. Award points to referrer
        const REFERRAL_POINTS = 100;
        await supabase.from("referral_points").insert({
            user_id: referrerId,
            points: REFERRAL_POINTS,
            reason: "Referred a new intern",
        });

        // 7. Also update profile total_points for leaderboard
        const { data: profile } = await supabase
            .from("profiles")
            .select("total_points")
            .eq("id", referrerId)
            .single();

        if (profile) {
            await supabase
                .from("profiles")
                .update({ total_points: (profile.total_points || 0) + REFERRAL_POINTS })
                .eq("id", referrerId);
        }

        // 8. Give referred user a welcome bonus
        const WELCOME_POINTS = 25;
        await this.awardPoints(referredId, WELCOME_POINTS, "Welcome bonus for joining via referral");

        return { success: true };
    }

    /**
     * Admin: Manually award points to a user.
     */
    static async awardPoints(userId: string, points: number, reason: string): Promise<{ success: boolean; error?: string }> {
        const supabase = await createAdminClient();

        // 1. Transaction: Insert point record
        const { error: pointError } = await supabase.from("referral_points").insert({
            user_id: userId,
            points: points,
            reason: reason,
        });

        if (pointError) return { success: false, error: pointError.message };

        // 2. Update profile total_points
        const { data: profile } = await supabase
            .from("profiles")
            .select("total_points")
            .eq("id", userId)
            .single();

        if (profile) {
            await supabase
                .from("profiles")
                .update({ total_points: (profile.total_points || 0) + points })
                .eq("id", userId);
        }

        return { success: true };
    }

    /**
     * Admin: Update referral status (e.g., confirm or reject).
     */
    static async updateReferralStatus(referralId: string, status: "confirmed" | "rejected"): Promise<{ success: boolean; error?: string }> {
        const supabase = await createAdminClient();

        // 1. Get referral details
        const { data: referral, error: refError } = await supabase
            .from("referrals")
            .select("*")
            .eq("id", referralId)
            .single();

        if (refError || !referral) return { success: false, error: "Referral not found" };

        if (referral.status === "confirmed") return { success: false, error: "Referral already confirmed" };

        // 2. Update status
        const { error: updateError } = await supabase
            .from("referrals")
            .update({
                status,
                confirmed_at: status === "confirmed" ? new Date().toISOString() : null
            })
            .eq("id", referralId);

        if (updateError) return { success: false, error: updateError.message };

        // 3. If confirmed, award automatic points
        if (status === "confirmed") {
            const REFERRAL_POINTS = 100;
            const WELCOME_POINTS = 25;

            // Award to referrer
            await this.awardPoints(referral.referrer_id, REFERRAL_POINTS, "Confirmed referral reward");

            // Award to referred
            await this.awardPoints(referral.referred_id, WELCOME_POINTS, "Welcome bonus for joining via referral");
        }

        return { success: true };
    }

    /**
     * Get total referral points balance for a user.
     */
    static async getPointsBalance(userId: string): Promise<number> {
        const supabase = await createAdminClient();

        const { data } = await supabase
            .from("referral_points")
            .select("points")
            .eq("user_id", userId);

        if (!data) return 0;
        return data.reduce((sum, row) => sum + row.points, 0);
    }

    /**
     * Get global platform settings.
     */
    static async getPlatformSettings() {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("platform_settings")
            .select("*")
            .maybeSingle();

        if (error) {
            console.error("[ReferralService] getPlatformSettings error:", error);
            return null;
        }
        return data;
    }

    /**
     * Get referral statistics. If userId is provided, gets stats for that user.
     * If isAdmin is true and no specific userId (or admin userId) is provided,
     * it can be extended to show global stats.
     */
    static async getReferralStats(userId: string, isGlobal = false) {
        const supabase = await createAdminClient();

        // Count referrals
        let query = supabase.from("referrals").select("id", { count: "exact", head: true });
        if (!isGlobal) {
            query = query.eq("referrer_id", userId);
        }
        const { count: totalReferrals } = await query;

        let confirmedQuery = supabase.from("referrals")
            .select("id", { count: "exact", head: true })
            .eq("status", "confirmed");
        if (!isGlobal) {
            confirmedQuery = confirmedQuery.eq("referrer_id", userId);
        }
        const { count: confirmedReferrals } = await confirmedQuery;

        // Total points
        const totalPoints = isGlobal ? 0 : await this.getPointsBalance(userId);

        // Leaderboard rank (only for interns)
        let rank = 0;
        if (!isGlobal) {
            const { data: rankings } = await supabase
                .from("profiles")
                .select("id, total_points")
                .eq("role", "intern")
                .order("total_points", { ascending: false });

            rank = rankings
                ? rankings.findIndex((p) => p.id === userId) + 1
                : 0;
        }

        return {
            totalReferrals: totalReferrals || 0,
            confirmedReferrals: confirmedReferrals || 0,
            totalPoints,
            leaderboardRank: rank || 0,
        };
    }

    /**
     * Get referral leaderboard.
     */
    static async getLeaderboard(limit = 10) {
        const supabase = await createAdminClient();

        const { data } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, total_points, current_streak")
            .eq("role", "intern")
            .order("total_points", { ascending: false })
            .limit(limit);

        return data || [];
    }

    /**
     * Get referral history. If isGlobal is true, returns all referrals.
     */
    static async getReferralHistory(userId: string, isGlobal = false) {
        const supabase = await createAdminClient();

        let query = supabase
            .from("referrals")
            .select("*, referrer:profiles!referrals_referrer_id_fkey(id, full_name, avatar_url), referred:profiles!referrals_referred_id_fkey(id, full_name, avatar_url, created_at)");

        if (!isGlobal) {
            query = query.eq("referrer_id", userId);
        }

        const { data } = await query.order("created_at", { ascending: false });

        return data || [];
    }

    /**
     * Get points transaction history for a user.
     */
    static async getPointsHistory(userId: string) {
        const supabase = await createAdminClient();

        const { data } = await supabase
            .from("referral_points")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        return data || [];
    }

    /**
     * Redeem a reward using referral points.
     */
    static async redeemReward(
        userId: string,
        rewardId: string
    ): Promise<{ success: boolean; error?: string; couponCode?: string }> {
        const supabase = await createAdminClient();

        // 1. Get reward details
        const { data: reward } = await supabase
            .from("reward_items")
            .select("*")
            .eq("id", rewardId)
            .eq("is_active", true)
            .is("archived_at", null)
            .single();

        if (!reward) return { success: false, error: "Reward not found or inactive" };

        // 2. Check expiry
        if (reward.expires_at && new Date(reward.expires_at) < new Date()) {
            return { success: false, error: "This reward has expired" };
        }

        // 3. Check max redemptions
        if (reward.max_redemptions && reward.current_redemptions >= reward.max_redemptions) {
            return { success: false, error: "This reward has reached maximum redemptions" };
        }

        // 4. Check balance
        const balance = await this.getPointsBalance(userId);
        if (balance < reward.points_required) {
            return {
                success: false,
                error: `Insufficient points. Need ${reward.points_required}, have ${balance}`,
            };
        }

        // 5. Generate coupon code if reward type is coupon
        let couponCode: string | undefined;
        if (reward.reward_type === "coupon") {
            couponCode = `CPS-${this.generateCode()}`;
        }

        // 6. Create redemption
        const { error: redeemError } = await supabase.from("redemptions").insert({
            user_id: userId,
            reward_item_id: rewardId,
            points_spent: reward.points_required,
            coupon_code: couponCode || null,
        });

        if (redeemError) {
            console.error("[ReferralService] Redemption error:", redeemError);
            return { success: false, error: redeemError.message };
        }

        // 7. Deduct points (negative entry in ledger)
        await supabase.from("referral_points").insert({
            user_id: userId,
            points: -reward.points_required,
            reason: `Redeemed: ${reward.name}`,
            reference_id: rewardId,
        });

        // 8. Increment redemption counter
        await supabase
            .from("reward_items")
            .update({ current_redemptions: (reward.current_redemptions || 0) + 1 })
            .eq("id", rewardId);

        // 9. Update profile total_points
        const { data: profile } = await supabase
            .from("profiles")
            .select("total_points")
            .eq("id", userId)
            .single();

        if (profile) {
            await supabase
                .from("profiles")
                .update({
                    total_points: Math.max(0, (profile.total_points || 0) - reward.points_required),
                })
                .eq("id", userId);
        }

        return { success: true, couponCode };
    }

    /**
     * Admin: Get a list of all referrers and their stats.
     */
    static async getReferrersList() {
        const supabase = await createAdminClient();

        // Fetch all referrals and group by referrer (or we can just fetch all interns and their confirmed referral counts)
        const { data: referrers, error } = await supabase
            .from("profiles")
            .select(`
                id,
                full_name,
                avatar_url,
                email,
                referrals:referrals!referrals_referrer_id_fkey(id, status)
            `)
            .eq("role", "intern");

        if (error) {
            console.error("[ReferralService] getReferrersList error:", error);
            return [];
        }

        return (referrers || []).map(p => ({
            ...p,
            totalReferrals: p.referrals?.length || 0,
            confirmedReferrals: p.referrals?.filter((r: any) => r.status === 'confirmed').length || 0
        })).filter(p => p.totalReferrals > 0);
    }
}
