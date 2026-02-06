"use client";

import { useState, useRef } from "react";
import { ImagePlus, Video, Loader2, Send, X } from "lucide-react";
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
    nicheId?: string;
}

interface MediaFile {
    url: string;
    type: "image" | "video";
    name: string;
}

export function PostComposer({ userId, userAvatar, userName, isAdmin, nicheId }: PostComposerProps) {
    const [content, setContent] = useState("");
    const [visibility, setVisibility] = useState<"all" | "interns" | "admins">("all");
    const [category, setCategory] = useState<'urgent' | 'high_priority' | 'brainstorm' | 'normal'>('normal');
    const [isPosting, setIsPosting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (file: File, type: "image" | "video") => {
        if (mediaFiles.length >= 4) {
            toast.error("Maximum 4 media files allowed");
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB");
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Upload failed");
            }

            const data = await response.json();
            setMediaFiles(prev => [...prev, {
                url: data.secure_url,
                type,
                name: file.name
            }]);
            toast.success("Media uploaded!");
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error.message || "Failed to upload media");
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file, "image");
        e.target.value = ""; // Reset for re-selection
    };

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file, "video");
        e.target.value = "";
    };

    const removeMedia = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!content.trim() && mediaFiles.length === 0) {
            toast.error("Please write something or add media to post");
            return;
        }

        setIsPosting(true);

        try {
            const mediaUrls = mediaFiles.map(m => m.url);
            const result = await createPost(content.trim(), mediaUrls, visibility, nicheId, category);

            if (!result.success) {
                toast.error(result.error || "Failed to create post");
            } else {
                toast.success("Post created!");
                setContent("");
                setMediaFiles([]);
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
                        disabled={isPosting || isUploading}
                    />

                    {/* Media Previews */}
                    {mediaFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {mediaFiles.map((media, index) => (
                                <div key={index} className="relative group">
                                    {media.type === "image" ? (
                                        <img
                                            src={media.url}
                                            alt={media.name}
                                            className="w-20 h-20 object-cover rounded-lg border"
                                        />
                                    ) : (
                                        <video
                                            src={media.url}
                                            className="w-20 h-20 object-cover rounded-lg border"
                                        />
                                    )}
                                    <button
                                        onClick={() => removeMedia(index)}
                                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                ref={imageInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageSelect}
                            />
                            <input
                                type="file"
                                ref={videoInputRef}
                                className="hidden"
                                accept="video/*"
                                onChange={handleVideoSelect}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-primary"
                                disabled={isPosting || isUploading || mediaFiles.length >= 4}
                                onClick={() => imageInputRef.current?.click()}
                                title="Upload image"
                            >
                                {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ImagePlus className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-primary"
                                disabled={isPosting || isUploading || mediaFiles.length >= 4}
                                onClick={() => videoInputRef.current?.click()}
                                title="Upload video"
                            >
                                <Video className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                                <div className="flex gap-2">
                                    <Select
                                        value={visibility}
                                        onValueChange={(v) => setVisibility(v as typeof visibility)}
                                        disabled={isPosting}
                                    >
                                        <SelectTrigger className="w-[110px] h-8 text-xs rounded-lg">
                                            <SelectValue placeholder="Visibility" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="all">Everyone</SelectItem>
                                            <SelectItem value="interns">Interns</SelectItem>
                                            <SelectItem value="admins">Admins</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={category}
                                        onValueChange={(v) => setCategory(v as typeof category)}
                                        disabled={isPosting}
                                    >
                                        <SelectTrigger className={`w-[130px] h-8 text-xs rounded-lg font-bold ${category !== 'normal' ? 'bg-zinc-900 text-white' : ''}`}>
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="normal">Normal Post</SelectItem>
                                            <SelectItem value="urgent">🚨 Urgent</SelectItem>
                                            <SelectItem value="high_priority">🔥 High Priority</SelectItem>
                                            <SelectItem value="brainstorm">💡 Brainstorm</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        <Button
                            onClick={handleSubmit}
                            disabled={(!content.trim() && mediaFiles.length === 0) || isPosting || isUploading}
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

