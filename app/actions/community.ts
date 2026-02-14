"use server";

import { getAuthUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/navigation";
import { ensureProfileSync } from "@/lib/profile-sync";

// Types
export interface Post {
    id: string;
    author_id: string;
    content: string;
    media_urls: string[];
    media_type: "image" | "video" | "mixed" | null;
    visibility: "all" | "interns" | "admins";
    is_pinned: boolean;
    likes_count: number;
    comments_count: number;
    created_at: string;
    updated_at: string;
    author?: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        role: string;
    };
    user_has_liked?: boolean;
    niche_id?: string | null;
    niche?: {
        name: string;
    } | null;
    category: 'urgent' | 'high_priority' | 'brainstorm' | 'normal';
    points_awarded: number;
}

export interface Niche {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    is_active: boolean;
    created_at: string;
}

export interface NicheMembership {
    id: string;
    user_id: string;
    niche_id: string;
    status: 'active' | 'suspended';
    niche?: Niche;
    profile?: {
        full_name: string | null;
        avatar_url: string | null;
        role: string;
    };
}

export interface Comment {
    id: string;
    post_id: string;
    author_id: string;
    content: string;
    parent_id: string | null;
    likes_count: number;
    created_at: string;
    author?: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
    };
    user_has_liked?: boolean;
}

// =============================================
// POSTS
// =============================================

export async function getPosts(limit = 20, offset = 0, nicheId?: string | null) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        let query = supabase
            .from("posts")
            .select(`
                *,
                author:profiles(id, full_name, avatar_url, role),
                niche:community_niches(name)
            `);

        // Filter by niche if provided
        if (nicheId !== undefined) {
            if (nicheId) {
                query = query.eq("niche_id", nicheId);
            } else {
                query = query.is("niche_id", null);
            }
        }

        const { data: posts, error } = await query
            .order("is_pinned", { ascending: false })
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("[Community] Error fetching posts:", JSON.stringify(error, null, 2));
            return { success: false, error: error.message, posts: [] };
        }

        // Check if user has liked each post
        const { data: userLikes } = await supabase
            .from("post_likes")
            .select("post_id")
            .eq("user_id", user.id)
            .in("post_id", posts?.map(p => p.id) || []);

        const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);

        const postsWithLikeStatus = posts?.map(post => ({
            ...post,
            user_has_liked: likedPostIds.has(post.id)
        })) || [];

        return { success: true, posts: postsWithLikeStatus };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("[Community] Unexpected error:", error);
        return { success: false, error: error.message, posts: [] };
    }
}

export async function createPost(
    content: string,
    mediaUrls: string[] = [],
    visibility: "all" | "interns" | "admins" = "all",
    nicheId?: string,
    category: 'urgent' | 'high_priority' | 'brainstorm' | 'normal' = 'normal'
) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        // Ensure Profile Exists Safely (Don't overwrite custom avatars)
        await ensureProfileSync(user, supabase);

        // Admins can pin priority posts
        const isPinned = user.role === 'admin' && category !== 'normal';

        // Determine media type
        let mediaType: "image" | "video" | "mixed" | null = null;
        if (mediaUrls.length > 0) {
            const hasImage = mediaUrls.some(url => /\.(jpg|jpeg|png|gif|webp)$/i.test(url));
            const hasVideo = mediaUrls.some(url => /\.(mp4|webm|mov)$/i.test(url));
            if (hasImage && hasVideo) mediaType = "mixed";
            else if (hasVideo) mediaType = "video";
            else if (hasImage) mediaType = "image";
        }

        const { data, error } = await supabase
            .from("posts")
            .insert({
                author_id: user.id,
                content,
                media_urls: mediaUrls,
                media_type: mediaType,
                visibility,
                niche_id: nicheId || null,
                category,
                is_pinned: isPinned
            })
            .select(`*, author:profiles(id, full_name, avatar_url, role)`)
            .single();

        if (error) throw error;

        revalidatePath("/dashboard/community");
        return { success: true, post: data };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        return { success: false, error: error.message };
    }
}

export async function rewardPost(postId: string, points: number) {
    try {
        const admin = await getAuthUser();
        if (admin.role !== 'admin') throw new Error("Only admins can reward posts");

        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .rpc('reward_post_v1', {
                post_id: postId,
                reward_points: points,
                admin_id: admin.id
            });

        if (error) throw error;

        // Update the post itself to reflect it's been rewarded
        await supabase
            .from('posts')
            .update({ points_awarded: points })
            .eq('id', postId);

        revalidatePath("/dashboard/community");
        return { success: true, ...data };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        return { success: false, error: error.message };
    }
}

export async function deletePost(postId: string) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        // Check ownership or admin status
        const { data: post } = await supabase
            .from("posts")
            .select("author_id")
            .eq("id", postId)
            .single();

        if (!post) {
            return { success: false, error: "Post not found" };
        }

        if (post.author_id !== user.id && user.role !== "admin") {
            return { success: false, error: "Not authorized to delete this post" };
        }

        const { error } = await supabase
            .from("posts")
            .delete()
            .eq("id", postId);

        if (error) {
            console.error("[Community] Error deleting post:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/dashboard/community");
        return { success: true };
    } catch (error: any) {
        console.error("[Community] Unexpected error:", error);
        return { success: false, error: error.message };
    }
}

export async function toggleLike(postId?: string, commentId?: string) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        if (!postId && !commentId) {
            return { success: false, error: "Either postId or commentId required" };
        }

        // Check if already liked
        let query = supabase.from("post_likes").select("id").eq("user_id", user.id);
        if (postId) query = query.eq("post_id", postId);
        if (commentId) query = query.eq("comment_id", commentId);

        const { data: existingLike } = await query.single();

        if (existingLike) {
            // Unlike
            const { error } = await supabase
                .from("post_likes")
                .delete()
                .eq("id", existingLike.id);

            if (error) {
                console.error("[Community] Error removing like:", error);
                return { success: false, error: error.message };
            }

            revalidatePath("/dashboard/community");
            return { success: true, liked: false };
        } else {
            // Like
            const { error } = await supabase
                .from("post_likes")
                .insert({
                    user_id: user.id,
                    post_id: postId || null,
                    comment_id: commentId || null,
                });

            if (error) {
                console.error("[Community] Error adding like:", error);
                return { success: false, error: error.message };
            }

            revalidatePath("/dashboard/community");
            return { success: true, liked: true };
        }
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("[Community] Unexpected error:", error);
        return { success: false, error: error.message };
    }
}

export async function togglePinPost(postId: string) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        // Only admins can pin posts
        if (user.role !== "admin") {
            return { success: false, error: "Only admins can pin posts" };
        }

        const { data: post } = await supabase
            .from("posts")
            .select("is_pinned")
            .eq("id", postId)
            .single();

        if (!post) {
            return { success: false, error: "Post not found" };
        }

        const { error } = await supabase
            .from("posts")
            .update({ is_pinned: !post.is_pinned })
            .eq("id", postId);

        if (error) {
            console.error("[Community] Error toggling pin:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/dashboard/community");
        return { success: true, isPinned: !post.is_pinned };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("[Community] Unexpected error:", error);
        return { success: false, error: error.message };
    }
}

// =============================================
// COMMENTS
// =============================================

export async function getComments(postId: string) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        const { data: comments, error } = await supabase
            .from("comments")
            .select(`
                *,
                author:profiles(id, full_name, avatar_url)
            `)
            .eq("post_id", postId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("[Community] Error fetching comments:", JSON.stringify(error, null, 2));
            return { success: false, error: error.message, comments: [] };
        }

        // Check if user has liked each comment
        const { data: userLikes } = await supabase
            .from("post_likes")
            .select("comment_id")
            .eq("user_id", user.id)
            .in("comment_id", comments?.map(c => c.id) || []);

        const likedCommentIds = new Set(userLikes?.map(l => l.comment_id) || []);

        const commentsWithLikeStatus = comments?.map(comment => ({
            ...comment,
            user_has_liked: likedCommentIds.has(comment.id)
        })) || [];

        return { success: true, comments: commentsWithLikeStatus };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("[Community] Unexpected error:", error);
        return { success: false, error: error.message, comments: [] };
    }
}

export async function createComment(postId: string, content: string, parentId?: string) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        // Ensure Profile Exists Safely (Don't overwrite custom avatars)
        const syncResult = await ensureProfileSync(user, supabase);

        if (!syncResult.success) {
            console.error("[Community] Profile sync failed in createComment:", syncResult.error);
            return {
                success: false,
                error: `Profile sync failed: ${syncResult.error}. Please contact support.`
            };
        }

        const { data, error } = await supabase
            .from("comments")
            .insert({
                post_id: postId,
                author_id: user.id,
                content,
                parent_id: parentId || null,
            })
            .select(`
                *,
                author:profiles(id, full_name, avatar_url)
            `)
            .single();

        if (error) {
            console.error("[Community] Error creating comment:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/dashboard/community");
        return { success: true, comment: data };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("[Community] Unexpected error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteComment(commentId: string) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        // Check ownership or admin status
        const { data: comment } = await supabase
            .from("comments")
            .select("author_id")
            .eq("id", commentId)
            .single();

        if (!comment) {
            return { success: false, error: "Comment not found" };
        }

        if (comment.author_id !== user.id && user.role !== "admin") {
            return { success: false, error: "Not authorized to delete this comment" };
        }

        const { error } = await supabase
            .from("comments")
            .delete()
            .eq("id", commentId);

        if (error) {
            console.error("[Community] Error deleting comment:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/dashboard/community");
        return { success: true };
    } catch (error: any) {
        console.error("[Community] Unexpected error:", error);
        return { success: false, error: error.message };
    }
}

// =============================================
// NICHES & MEMBERSHIPS
// =============================================

export async function getNiches() {
    try {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("community_niches")
            .select("*")
            .eq("is_active", true)
            .order("name");

        if (error) throw error;
        return { success: true, niches: data as Niche[] };
    } catch (error: any) {
        return { success: false, error: error.message, niches: [] };
    }
}

export async function createNiche(name: string, description: string, icon: string) {
    try {
        const user = await getAuthUser();
        if (user.role !== 'admin') throw new Error("Unauthorized");

        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("community_niches")
            .insert({ name, description, icon, created_by: user.id })
            .select()
            .single();

        if (error) throw error;
        revalidatePath("/dashboard/community");
        return { success: true, niche: data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateNiche(id: string, updates: Partial<Niche>) {
    try {
        const user = await getAuthUser();
        if (user.role !== 'admin') throw new Error("Unauthorized");

        const supabase = await createAdminClient();
        const { error } = await supabase
            .from("community_niches")
            .update(updates)
            .eq("id", id);

        if (error) throw error;
        revalidatePath("/dashboard/community");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteNiche(id: string) {
    try {
        const user = await getAuthUser();
        if (user.role !== 'admin') throw new Error("Unauthorized");

        const supabase = await createAdminClient();
        const { error } = await supabase
            .from("community_niches")
            .delete()
            .eq("id", id);

        if (error) throw error;
        revalidatePath("/dashboard/community");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function joinNiche(nicheId: string) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        const { error } = await supabase
            .from("niche_memberships")
            .upsert({ user_id: user.id, niche_id: nicheId, status: 'active' }, { onConflict: 'user_id,niche_id' })
            .select()
            .single();

        if (error) throw error;
        revalidatePath("/dashboard/community");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getUserNiches() {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        const { data, error } = await supabase
            .from("niche_memberships")
            .select(`
                *,
                niche:community_niches(*)
            `)
            .eq("user_id", user.id)
            .eq("status", 'active');

        if (error) throw error;
        return { success: true, memberships: data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAllMemberships() {
    try {
        const admin = await getAuthUser();
        if (admin.role !== 'admin') throw new Error("Unauthorized");

        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("niche_memberships")
            .select(`
                *,
                niche:community_niches(name),
                profile:profiles(full_name, avatar_url, role)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, memberships: data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function manageMembership(userId: string, nicheId: string, status: 'active' | 'suspended') {
    try {
        const admin = await getAuthUser();
        if (admin.role !== 'admin') throw new Error("Unauthorized");

        const supabase = await createAdminClient();
        const { error } = await supabase
            .from("niche_memberships")
            .update({ status })
            .match({ user_id: userId, niche_id: nicheId });

        if (error) throw error;
        revalidatePath("/dashboard/community");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAllProfiles() {
    try {
        const user = await getAuthUser();
        if (user.role !== 'admin') throw new Error("Unauthorized");

        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, role")
            .order("full_name");

        if (error) throw error;
        return { success: true, profiles: data };
    } catch (error: any) {
        return { success: false, error: error.message, profiles: [] };
    }
}

export async function adminAddInternToNiche(userId: string, nicheId: string) {
    try {
        const admin = await getAuthUser();
        if (admin.role !== 'admin') throw new Error("Unauthorized");

        const supabase = await createAdminClient();
        const { error } = await supabase
            .from("niche_memberships")
            .upsert({ user_id: userId, niche_id: nicheId, status: 'active' }, { onConflict: 'user_id,niche_id' });

        if (error) throw error;
        revalidatePath("/dashboard/community");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// =============================================
// ONBOARDING
// =============================================

export async function submitCommunityOnboarding(data: {
    nicheId: string;
    interests: string;
    goals: string;
    painPoints: string;
}) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        // 1. Save onboarding responses
        const { error: responseError } = await supabase
            .from("community_onboarding_responses")
            .insert({
                user_id: user.id,
                niche_id: data.nicheId,
                interests: data.interests,
                goals: data.goals,
                pain_points: data.painPoints
            });

        if (responseError) throw responseError;

        // 2. Join the niche
        const { error: joinError } = await supabase
            .from("niche_memberships")
            .upsert({
                user_id: user.id,
                niche_id: data.nicheId,
                status: 'active'
            }, { onConflict: 'user_id,niche_id' });

        if (joinError) throw joinError;

        revalidatePath("/dashboard/community");
        return { success: true };
    } catch (error: any) {
        console.error("[Community] Onboarding error:", error);
        return { success: false, error: error.message };
    }
}

export async function getUserMembershipStatus() {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        const { data, error } = await supabase
            .from("niche_memberships")
            .select("*, niche:community_niches(*)")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();

        if (error) throw error;

        return { success: true, membership: data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAllOnboardingResponses() {
    try {
        const admin = await getAuthUser();
        if (admin.role !== 'admin') throw new Error("Unauthorized");

        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("community_onboarding_responses")
            .select(`
                *,
                profile:profiles(id, full_name, avatar_url),
                niche:community_niches(name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, responses: data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
