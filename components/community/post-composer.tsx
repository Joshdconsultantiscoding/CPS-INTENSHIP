"use client";

import { useState } from "react";
import { ImagePlus, Video, Loader2, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createPost } from "@/app/actions/community";

interface PostComposerProps {
    userId: string;
    userAvatar?: string | null;
    userName?: string | null;
    isAdmin: boolean;
}

export function PostComposer({ userId, userAvatar, userName, isAdmin }: PostComposerProps) {
    const [content, setContent] = useState("");
    const [visibility, setVisibility] = useState<"all" | "interns" | "admins">("all");
    const [isPosting, setIsPosting] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast.error("Please write something to post");
            return;
        }

        setIsPosting(true);

        try {
            const result = await createPost({
                content: content.trim(),
                visibility,
            });

            if (!result.success) {
                toast.error(result.error || "Failed to create post");
            } else {
                toast.success("Post created!");
                setContent("");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsPosting(false);
        }
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) return "?";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    return (
        <div className="bg-card border rounded-xl p-5 space-y-4">
            <div className="flex gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={userAvatar || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(userName)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                    <Textarea
                        placeholder="Share something with the community..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[80px] resize-none border-0 bg-muted/50 focus-visible:ring-1"
                        disabled={isPosting}
                    />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground"
                                disabled={isPosting}
                                title="Upload image (coming soon)"
                            >
                                <ImagePlus className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground"
                                disabled={isPosting}
                                title="Upload video (coming soon)"
                            >
                                <Video className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                                <Select
                                    value={visibility}
                                    onValueChange={(v) => setVisibility(v as typeof visibility)}
                                    disabled={isPosting}
                                >
                                    <SelectTrigger className="w-[120px] h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Everyone</SelectItem>
                                        <SelectItem value="interns">Interns Only</SelectItem>
                                        <SelectItem value="admins">Admins Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <Button
                            onClick={handleSubmit}
                            disabled={!content.trim() || isPosting}
                            size="sm"
                            className="gap-2"
                        >
                            {isPosting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            Post
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
