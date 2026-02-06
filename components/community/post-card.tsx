"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, MoreHorizontal, Pin, Trash2, Award, Zap, Flame, Lightbulb, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { toggleLike, deletePost, togglePinPost, rewardPost, type Post } from "@/app/actions/community";
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
    const [rewarding, setRewarding] = useState(false);

    const isAuthor = post.author_id === currentUserId;
    const canReward = isAdmin && !isAuthor;

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

    const handleReward = async (points: number) => {
        setRewarding(true);
        const result = await rewardPost(post.id, points);
        if (result.success) {
            toast.success(`Rewarded ${points} points!`);
        } else {
            toast.error(result.error || "Failed to reward post");
        }
        setRewarding(false);
    };

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'urgent': return "bg-red-500 text-white border-red-600";
            case 'high_priority': return "bg-zinc-900 text-white border-black";
            case 'brainstorm': return "bg-emerald-500 text-white border-emerald-600";
            default: return "bg-zinc-100 text-zinc-600 border-zinc-200";
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'urgent': return <AlertCircle className="h-3 w-3 mr-1" />;
            case 'high_priority': return <Flame className="h-3 w-3 mr-1" />;
            case 'brainstorm': return <Lightbulb className="h-3 w-3 mr-1" />;
            default: return null;
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
                            {post.author?.role === 'admin' && (
                                <Badge variant="secondary" className="bg-zinc-900 text-white text-[8px] px-1.5 py-0 rounded-full font-bold uppercase tracking-tighter">Admin</Badge>
                            )}
                            {post.is_pinned && (
                                <Pin className="h-3 w-3 text-primary fill-primary" />
                            )}
                            {post.category && post.category !== 'normal' && (
                                <Badge className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-sm", getCategoryStyles(post.category))}>
                                    {getCategoryIcon(post.category)}
                                    {post.category.replace('_', ' ').toUpperCase()}
                                </Badge>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {post.points_awarded > 0 && (
                        <div className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-2xl flex items-center gap-1.5 shadow-sm animate-pulse">
                            <Award className="h-4 w-4" />
                            <span className="text-xs font-bold">+{post.points_awarded} Reward</span>
                        </div>
                    )}

                    {(isAuthor || isAdmin) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {isAdmin && (
                                    <>
                                        <DropdownMenuItem onClick={handleTogglePin}>
                                            <Pin className="h-4 w-4 mr-2" />
                                            {post.is_pinned ? "Unpin" : "Pin"} Post
                                        </DropdownMenuItem>
                                        {canReward && (
                                            <div className="px-2 py-1.5 border-b border-zinc-100">
                                                <p className="text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-widest">Reward brilliant post</p>
                                                <div className="grid grid-cols-2 gap-1">
                                                    <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={() => handleReward(50)} disabled={rewarding}>+50 pts</Button>
                                                    <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold rounded-lg border-zinc-900 bg-zinc-900 text-white hover:bg-black" onClick={() => handleReward(100)} disabled={rewarding}>+100 pts</Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
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
