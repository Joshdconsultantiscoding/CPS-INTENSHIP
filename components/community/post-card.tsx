"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, MoreHorizontal, Pin, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { toggleLike, deletePost, togglePinPost, type Post } from "@/app/actions/community";
import { CommentSection } from "./comment-section";
import { MediaGallery } from "./media-gallery";

interface PostCardProps {
    post: Post;
    currentUserId: string;
    isAdmin: boolean;
}

export function PostCard({ post, currentUserId, isAdmin }: PostCardProps) {
    const [liked, setLiked] = useState(post.user_has_liked || false);
    const [likesCount, setLikesCount] = useState(post.likes_count);
    const [showComments, setShowComments] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isAuthor = post.author_id === currentUserId;

    const handleLike = async () => {
        const previousLiked = liked;
        const previousCount = likesCount;

        // Optimistic update
        setLiked(!liked);
        setLikesCount(liked ? likesCount - 1 : likesCount + 1);

        const result = await toggleLike(post.id);

        if (!result.success) {
            // Revert on error
            setLiked(previousLiked);
            setLikesCount(previousCount);
            toast.error(result.error || "Failed to update like");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        setIsDeleting(true);
        const result = await deletePost(post.id);

        if (!result.success) {
            toast.error(result.error || "Failed to delete post");
            setIsDeleting(false);
        } else {
            toast.success("Post deleted");
        }
    };

    const handleTogglePin = async () => {
        const result = await togglePinPost(post.id);

        if (!result.success) {
            toast.error(result.error || "Failed to update pin status");
        } else {
            toast.success(result.isPinned ? "Post pinned" : "Post unpinned");
        }
    };

    const getInitials = (name: string | null) => {
        if (!name) return "?";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    return (
        <div className={cn(
            "bg-card border rounded-xl p-5 space-y-4 transition-all",
            post.is_pinned && "border-primary/50 bg-primary/5",
            isDeleting && "opacity-50 pointer-events-none"
        )}>
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(post.author?.full_name || null)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">
                                {post.author?.full_name || "Unknown User"}
                            </span>
                            {post.is_pinned && (
                                <Pin className="h-3 w-3 text-primary fill-primary" />
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                    </div>
                </div>

                {(isAuthor || isAdmin) && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {isAdmin && (
                                <DropdownMenuItem onClick={handleTogglePin}>
                                    <Pin className="h-4 w-4 mr-2" />
                                    {post.is_pinned ? "Unpin" : "Pin"} Post
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={handleDelete}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Post
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Content */}
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {post.content}
            </div>

            {/* Media */}
            {post.media_urls && post.media_urls.length > 0 && (
                <MediaGallery urls={post.media_urls} type={post.media_type} />
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 pt-2 border-t">
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "gap-2 text-muted-foreground hover:text-primary",
                        liked && "text-red-500 hover:text-red-600"
                    )}
                    onClick={handleLike}
                >
                    <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                    <span>{likesCount}</span>
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-primary"
                    onClick={() => setShowComments(!showComments)}
                >
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.comments_count}</span>
                </Button>
            </div>

            {/* Comments */}
            {showComments && (
                <CommentSection
                    postId={post.id}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                />
            )}
        </div>
    );
}
