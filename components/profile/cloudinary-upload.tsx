"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Image as ImageIcon, FileVideo, File, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CloudinaryUploadProps {
    onUploadComplete: (url: string) => void;
    onError?: (error: string) => void;
    accept?: string;
    maxSize?: number; // in MB
    folder?: string;
    className?: string;
    variant?: "avatar" | "cover" | "media" | "document";
    currentUrl?: string;
    disabled?: boolean;
}

export function CloudinaryUpload({
    onUploadComplete,
    onError,
    accept = "image/*,video/*",
    maxSize = 10,
    folder = "profiles",
    className,
    variant = "media",
    currentUrl,
    disabled = false,
}: CloudinaryUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState<string | null>(currentUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getVariantStyles = () => {
        switch (variant) {
            case "avatar":
                return "w-32 h-32 rounded-full";
            case "cover":
                return "w-full h-48 rounded-xl";
            case "document":
                return "w-full h-32 rounded-lg";
            default:
                return "w-full h-40 rounded-lg";
        }
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    }, []);

    const validateFile = (file: File): string | null => {
        const maxBytes = maxSize * 1024 * 1024;
        if (file.size > maxBytes) {
            return `File size must be less than ${maxSize}MB`;
        }
        return null;
    };

    const uploadFile = async (file: File) => {
        const error = validateFile(file);
        if (error) {
            onError?.(error);
            return;
        }

        setIsUploading(true);
        setProgress(0);

        // Create preview for images
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", folder);

            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const data = await response.json();
            setProgress(100);
            setPreview(data.secure_url);
            onUploadComplete(data.secure_url);
        } catch (err) {
            setPreview(null);
            onError?.(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setIsUploading(false);
            setProgress(0);
        }
    };

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            if (disabled) return;

            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                uploadFile(files[0]);
            }
        },
        [disabled]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        const files = e.target.files;
        if (files && files.length > 0) {
            uploadFile(files[0]);
        }
    };

    const handleClick = () => {
        if (!disabled && !isUploading) {
            fileInputRef.current?.click();
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        onUploadComplete("");
    };

    const getIcon = () => {
        if (accept.includes("video")) return <FileVideo className="h-8 w-8" />;
        if (accept.includes("image")) return <ImageIcon className="h-8 w-8" />;
        return <File className="h-8 w-8" />;
    };

    return (
        <div className={cn("relative", className)}>
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleChange}
                className="hidden"
                disabled={disabled || isUploading}
            />

            <div
                onClick={handleClick}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                    "relative flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer overflow-hidden",
                    getVariantStyles(),
                    isDragging && "border-primary bg-primary/5 scale-105",
                    !isDragging && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                    disabled && "opacity-50 cursor-not-allowed",
                    preview && "border-solid border-primary/30"
                )}
            >
                {preview ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={preview}
                            alt="Preview"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                                size="sm"
                                variant="secondary"
                                className="h-8"
                                onClick={handleClick}
                            >
                                <Upload className="h-4 w-4 mr-1" />
                                Change
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                className="h-8"
                                onClick={handleRemove}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </>
                ) : isUploading ? (
                    <div className="flex flex-col items-center gap-3 p-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <Progress value={progress} className="w-32 h-2" />
                        <span className="text-sm text-muted-foreground">
                            Uploading... {progress}%
                        </span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground">
                        {getIcon()}
                        <span className="text-sm font-medium">
                            {isDragging ? "Drop file here" : "Click or drag to upload"}
                        </span>
                        <span className="text-xs">Max {maxSize}MB</span>
                    </div>
                )}
            </div>
        </div>
    );
}
