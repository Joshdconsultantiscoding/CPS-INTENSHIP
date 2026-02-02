"use client";

import { useEffect, useState } from "react";
import { Loader2, PlayCircle, AlertCircle } from "lucide-react";

interface VideoPlayerProps {
    url: string;
    title?: string;
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!url) return;

        let formattedUrl = url;

        // YouTube
        if (url.includes("youtube.com/watch?v=")) {
            const videoId = url.split("v=")[1]?.split("&")[0];
            formattedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (url.includes("youtu.be/")) {
            const videoId = url.split("youtu.be/")[1];
            formattedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
        // Loom
        else if (url.includes("loom.com/share/")) {
            const videoId = url.split("loom.com/share/")[1];
            formattedUrl = `https://www.loom.com/embed/${videoId}`;
        }
        // Vimeo
        else if (url.includes("vimeo.com/")) {
            const videoId = url.split("vimeo.com/")[1];
            formattedUrl = `https://player.vimeo.com/video/${videoId}`;
        }

        setEmbedUrl(formattedUrl);
        setIsLoading(false);
    }, [url]);

    if (!url) {
        return (
            <div className="aspect-video w-full bg-muted flex flex-col items-center justify-center rounded-lg border-2 border-dashed">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No video URL provided for this lesson.</p>
            </div>
        );
    }

    return (
        <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden shadow-lg border">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {embedUrl ? (
                <iframe
                    src={embedUrl}
                    title={title || "Video Player"}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-neutral-900 px-6 text-center">
                    <PlayCircle className="h-12 w-12 mb-4 opacity-50" />
                    <p className="font-medium">Unsupported Video Format</p>
                    <p className="text-sm text-neutral-400 mt-2">
                        Please provide a valid YouTube, Loom, or Vimeo URL.
                    </p>
                </div>
            )}
        </div>
    );
}
