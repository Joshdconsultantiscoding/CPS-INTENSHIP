"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaGalleryProps {
    urls: string[];
    type: "image" | "video" | "mixed" | null;
}

export function MediaGallery({ urls, type }: MediaGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    if (!urls || urls.length === 0) return null;

    const isVideo = (url: string) => {
        return url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes("youtube") || url.includes("vimeo");
    };

    const getGridClass = (count: number) => {
        if (count === 1) return "grid-cols-1";
        if (count === 2) return "grid-cols-2";
        if (count === 3) return "grid-cols-2";
        return "grid-cols-2";
    };

    return (
        <>
            <div className={cn("grid gap-2 rounded-lg overflow-hidden", getGridClass(urls.length))}>
                {urls.slice(0, 4).map((url, index) => (
                    <div
                        key={index}
                        className={cn(
                            "relative bg-muted cursor-pointer overflow-hidden rounded-lg",
                            urls.length === 3 && index === 0 && "row-span-2",
                            urls.length === 1 ? "aspect-video" : "aspect-square"
                        )}
                        onClick={() => setLightboxIndex(index)}
                    >
                        {isVideo(url) ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <video
                                    src={url}
                                    className="w-full h-full object-cover"
                                    muted
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-black/50 rounded-full p-3">
                                        <Play className="h-8 w-8 text-white fill-white" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Image
                                src={url}
                                alt={`Media ${index + 1}`}
                                fill
                                className="object-cover hover:scale-105 transition-transform"
                            />
                        )}
                        {index === 3 && urls.length > 4 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">
                                    +{urls.length - 4}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                    onClick={() => setLightboxIndex(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300"
                        onClick={() => setLightboxIndex(null)}
                        aria-label="Close lightbox"
                    >
                        <X className="h-8 w-8" />
                    </button>
                    <div
                        className="max-w-4xl max-h-[90vh] relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {isVideo(urls[lightboxIndex]) ? (
                            <video
                                src={urls[lightboxIndex]}
                                controls
                                autoPlay
                                className="max-w-full max-h-[90vh]"
                            />
                        ) : (
                            <Image
                                src={urls[lightboxIndex]}
                                alt="Media"
                                width={1200}
                                height={800}
                                className="max-w-full max-h-[90vh] object-contain"
                            />
                        )}
                    </div>
                    {/* Navigation */}
                    {urls.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {urls.map((_, i) => (
                                <button
                                    key={i}
                                    className={cn(
                                        "w-2 h-2 rounded-full",
                                        i === lightboxIndex ? "bg-white" : "bg-white/50"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLightboxIndex(i);
                                    }}
                                    aria-label={`View image ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
