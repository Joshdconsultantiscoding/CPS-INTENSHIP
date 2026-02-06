"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, File, Image as ImageIcon, Music, Video } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface FileUploaderProps {
    onUploadComplete: (url: string) => void;
    bucket?: string;
    folder?: string;
    label?: string;
    accept?: string;
    maxSizeMB?: number;
}

export function FileUploader({
    onUploadComplete,
    bucket = "portal-assets",
    folder = "submissions",
    label = "Upload File",
    accept = "image/*,video/mp4,audio/*,application/pdf",
    maxSizeMB = 10,
}: FileUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.size > maxSizeMB * 1024 * 1024) {
            toast.error(`File size must be less than ${maxSizeMB}MB`);
            return;
        }

        setIsUploading(true);
        setFileName(file.name);

        try {
            const supabase = createClient();
            const ext = file.name.split('.').pop();
            const path = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(path);

            setFileUrl(publicUrl);
            onUploadComplete(publicUrl);
            toast.success("File uploaded successfully");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to upload file");
            setFileName(null);
        } finally {
            setIsUploading(false);
        }
    };

    const getIcon = () => {
        if (!fileName) return <Upload className="w-5 h-5" />;
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext!)) return <ImageIcon className="w-5 h-5 text-blue-500" />;
        if (['mp4', 'mov', 'webm'].includes(ext!)) return <Video className="w-5 h-5 text-purple-500" />;
        if (['mp3', 'wav', 'ogg'].includes(ext!)) return <Music className="w-5 h-5 text-green-500" />;
        return <File className="w-5 h-5 text-gray-500" />;
    };

    return (
        <div className="space-y-2">
            <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`
                    border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer
                    ${isUploading ? 'bg-muted/50 cursor-not-allowed' : 'hover:border-primary/50 hover:bg-primary/5'}
                    ${fileUrl ? 'border-primary/30 bg-primary/5' : 'border-muted'}
                `}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-md border shadow-sm">
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : getIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                            {fileName || label}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                            {isUploading ? "Uploading to secure storage..." : (fileUrl ? "Click to change file" : `Max ${maxSizeMB}MB: Pictures, Audio, Short Video`)}
                        </div>
                    </div>
                    {fileUrl && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                setFileUrl(null);
                                setFileName(null);
                            }}
                            title="Remove file"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={accept}
                title="Choose file"
                aria-label="Choose file"
                onChange={handleFileChange}
            />
        </div>
    );
}
