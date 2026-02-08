"use client";

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
    currentUrl?: string;
    onUploadComplete: (url: string) => void;
    onError?: (error: string) => void;
    size?: "sm" | "md" | "lg" | "xl";
    fallback?: string;
    className?: string;
    disabled?: boolean;
}

async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area
): Promise<Blob> {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Could not get canvas context");

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
        }, "image/jpeg", 0.9);
    });
}

export function AvatarUpload({
    currentUrl,
    onUploadComplete,
    onError,
    size = "lg",
    fallback = "U",
    className,
    disabled = false,
}: AvatarUploadProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showCropper, setShowCropper] = useState(false);

    const sizeClasses = {
        sm: "h-16 w-16",
        md: "h-24 w-24",
        lg: "h-32 w-32",
        xl: "h-40 w-40",
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.onload = () => {
                setImageSrc(reader.result as string);
                setShowCropper(true);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSaveCrop = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setIsUploading(true);
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            const formData = new FormData();
            formData.append("file", croppedBlob, "avatar.jpg");
            formData.append("folder", "avatars");

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");

            const data = await response.json();
            onUploadComplete(data.secure_url);
            setShowCropper(false);
            setImageSrc(null);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
        } catch (err) {
            onError?.(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        setShowCropper(false);
        setImageSrc(null);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
    };

    return (
        <>
            <div className={cn("relative group", className)}>
                <Avatar className={cn(sizeClasses[size], "border-4 border-background shadow-xl")}>
                    <AvatarImage src={currentUrl || ""} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                        {fallback}
                    </AvatarFallback>
                </Avatar>

                <label
                    className={cn(
                        "absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
                        disabled && "cursor-not-allowed"
                    )}
                >
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={disabled}
                    />
                    <Camera className="h-6 w-6 text-white" />
                </label>

                {currentUrl && (
                    <button
                        onClick={() => onUploadComplete("")}
                        className="absolute -top-1 -right-1 p-1 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="h-3 w-3 text-white" />
                    </button>
                )}
            </div>

            <Dialog open={showCropper} onOpenChange={setShowCropper}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Crop your photo</DialogTitle>
                    </DialogHeader>

                    <div className="relative h-64 bg-muted rounded-lg overflow-hidden">
                        {imageSrc && (
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        )}
                    </div>

                    <div className="flex items-center gap-4 px-4">
                        <ZoomIn className="h-4 w-4 text-muted-foreground" />
                        <Slider
                            value={[zoom]}
                            onValueChange={([v]) => setZoom(v)}
                            min={1}
                            max={3}
                            step={0.1}
                            className="flex-1"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancel} disabled={isUploading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveCrop} disabled={isUploading}>
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
