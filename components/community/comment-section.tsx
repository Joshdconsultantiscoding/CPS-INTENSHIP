"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, Loader2, Send, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    getComments,
    createComment,
    deleteComment,
    toggleLike,
    type Comment
} from "@/app/actions/community";

interface CommentSectionProps {
    postId: string;
    currentUserId: string;
    isAdmin: boolean;
}

export function CommentSection({ postId, currentUserId, isAdmin }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        loadComments();
    }, [postId]);

    const loadComments = async () => {
        setIsLoading(true);
        const result = await getComments(postId);
        if (result.success) {
            setComments(result.comments);
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsPosting(true);
        const result = await createComment(postId, newComment.trim());

        if (result.success && result.comment) {
            setComments([...comments, result.comment]);
            setNewComment("");
        } else {
            toast.error(result.error || "Failed to add comment");
        }
        setIsPosting(false);
    };

    const handleDelete = async (commentId: string) => {
        const result = await deleteComment(commentId);
        if (result.success) {
            setComments(comments.filter(c => c.id !== commentId));
            toast.success("Comment deleted");
        } else {
            toast.error(result.error || "Failed to delete comment");
        }
    };

    const handleLike = async (commentId: string, index: number) => {
        const comment = comments[index];
        const previousLiked = comment.user_has_liked;
        const previousCount = comment.likes_count;

        // Optimistic update
        const updated = [...comments];
        updated[index] = {
            ...comment,
            user_has_liked: !previousLiked,
            likes_count: previousLiked ? previousCount - 1 : previousCount + 1,
        };
        setComments(updated);

        const result = await toggleLike(undefined, commentId);

        if (!result.success) {
            // Revert on error
            const reverted = [...comments];
            reverted[index] = {
                ...comment,
                user_has_liked: previousLiked,
                likes_count: previousCount,
            };
            setComments(reverted);
            toast.error(result.error || "Failed to update like");
        }
    };

    const getInitials = (name: string | null) => {
        if (!name) return "?";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4 pt-4 border-t">
            {/* Comment Input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={isPosting}
                    className="flex-1"
                />
                <Button
                    type="submit"
                    size="sm"
                    disabled={!newComment.trim() || isPosting}
                >
                    {isPosting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </form>

            {/* Comments List */}
            <div className="space-y-3">
                {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                        No comments yet. Be the first!
                    </p>
                ) : (
                    comments.map((comment, index) => (
                        <div key={comment.id} className="flex gap-2 group">
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={comment.author?.avatar_url || ""} />
                                <AvatarFallback className="bg-muted text-xs">
                                    {getInitials(comment.author?.full_name || null)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="bg-muted rounded-lg px-3 py-2">
                                    <span className="font-medium text-sm">
                                        {comment.author?.full_name || "Unknown"}
                                    </span>
                                    <p className="text-sm">{comment.content}</p>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    <span>
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                    <button
                                        onClick={() => handleLike(comment.id, index)}
                                        className={cn(
                                            "hover:text-primary",
                                            comment.user_has_liked && "text-red-500"
                                        )}
                                    >
                                        <Heart className={cn(
                                            "h-3 w-3 inline mr-1",
                                            comment.user_has_liked && "fill-current"
                                        )} />
                                        {comment.likes_count > 0 && comment.likes_count}
                                    </button>
                                    {(comment.author_id === currentUserId || isAdmin) && (
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="Delete comment"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
