"use client";

import React, { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Loader2, Upload, X, Crop } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
    onUploadComplete: (url: string) => void;
    aspectRatio?: number;
    initialImage?: string;
    bucket: "profiles" | "portal-assets";
    folder?: string;
    label?: string;
}

export function ImageUpload({
    onUploadComplete,
    aspectRatio = 1,
    initialImage,
    bucket,
    folder,
    label = "Upload Image",
}: ImageUploadProps) {
    const [image, setImage] = useState<string | null>(initialImage || null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("File size must be less than 2MB");
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setTempImage(reader.result as string);
                setIsDialogOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.setAttribute("crossOrigin", "anonymous");
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: any
    ): Promise<Blob | null> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) return null;

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
                resolve(blob);
            }, "image/jpeg", 0.9);
        });
    };

    const handleUpload = async () => {
        if (!tempImage || !croppedAreaPixels) return;

        setIsUploading(true);
        try {
            const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels);
            if (!croppedBlob) throw new Error("Failed to crop image");

            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();

            const fileName = `${folder ? `${folder}/` : ""}${Date.now()}.jpg`;

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, croppedBlob, {
                    contentType: "image/jpeg",
                    upsert: true,
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            setImage(publicUrl);
            onUploadComplete(publicUrl);
            setIsDialogOpen(false);
            toast.success("Image uploaded successfully");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                {image ? (
                    <div className="relative group">
                        <img
                            src={image}
                            alt="Preview"
                            className="w-24 h-24 rounded-lg object-cover border"
                        />
                        <button
                            onClick={() => setImage(null)}
                            title="Remove image"
                            aria-label="Remove image"
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Crop className="w-4 h-4 mr-2" />
                        )}
                        {label}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        JPG or PNG. Max size 2MB.
                    </p>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                title="Upload file"
                aria-label="Upload file"
                onChange={handleFileChange}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Crop Image</DialogTitle>
                    </DialogHeader>
                    <div className="relative h-[400px] w-full bg-black rounded-md overflow-hidden">
                        {tempImage && (
                            <Cropper
                                image={tempImage}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspectRatio}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        )}
                    </div>
                    <div className="space-y-2 py-4">
                        <label className="text-sm font-medium">Zoom</label>
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={([val]) => setZoom(val)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpload} disabled={isUploading}>
                            {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Upload & Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
