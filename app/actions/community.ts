"use server";

import { getAuthUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

export async function getPosts(limit = 20, offset = 0) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        const { data: posts, error } = await supabase
            .from("posts")
            .select(`
                *,
                author:profiles(id, full_name, avatar_url, role)
            `)
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
        console.error("[Community] Unexpected error:", error);
        return { success: false, error: error.message, posts: [] };
    }
}

export async function createPost(content: string, mediaUrls: string[] = [], visibility: "all" | "interns" | "admins" = "all") {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        // Ensure Profile Exists
        const { error: upsertError } = await supabase.from("profiles").upsert({
            id: user.id,
            email: user.email || "",
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            role: user.role,
            updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

        if (upsertError) {
            console.error("[Community] Profile Upsert Failed:", JSON.stringify(upsertError, null, 2));
            return { success: false, error: `Profile sync failed: ${upsertError.message}` };
        }

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
            })
            .select(`*, author:profiles(id, full_name, avatar_url, role)`)
            .single();

        if (error) {
            console.error("[Community] Error creating post:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/dashboard/community");
        return { success: true, post: data };
    } catch (error: any) {
        console.error("[Community] Unexpected error:", error);
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
        console.error("[Community] Unexpected error:", error);
        return { success: false, error: error.message, comments: [] };
    }
}

export async function createComment(postId: string, content: string, parentId?: string) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        // Ensure Profile Exists
        const { error: upsertError } = await supabase.from("profiles").upsert({
            id: user.id,
            email: user.email || "",
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            role: user.role,
            updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

        if (upsertError) {
            console.error("[Community] Profile Upsert Failed. Details:", JSON.stringify(upsertError, null, 2));
            return {
                success: false,
                error: `Profile sync failed: ${upsertError.message} (Code: ${upsertError.code}). Please contact support.`
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
