"use client";

import { useEffect, useState } from "react";
import { Changelog } from "@/lib/changelog/changelog-types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangelogItem } from "./changelog-item";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WhatsNewModalProps {
    changelog: Changelog | null;
    onClose: (version: string) => void;
}

export function WhatsNewModal({ changelog, onClose }: WhatsNewModalProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (changelog) {
            setOpen(true);
        }
    }, [changelog]);

    if (!changelog) return null;

    const handleClose = () => {
        setOpen(false);
        onClose(changelog.version);
    };

    const handleViewAll = () => {
        setOpen(false);
        onClose(changelog.version);
        router.push("/dashboard/updates");
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden gap-0 border-none shadow-2xl bg-background/95 backdrop-blur-xl">
                {/* Header Decoration */}
                <div className="h-40 bg-gradient-to-br from-primary via-primary/90 to-primary/40 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full -translate-x-12 -translate-y-12" />
                        <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-16 translate-y-16" />
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-5 rounded-3xl shadow-2xl border border-white/20 animate-in zoom-in-50 duration-500">
                        <Rocket className="h-12 w-12 text-white drop-shadow-lg" />
                    </div>
                    <div className="absolute bottom-4 right-6 text-white/40 font-black text-6xl select-none tracking-tighter">
                        NEW
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-mono shadow-sm">
                                v{changelog.version.replace(/^v/, '')}
                            </Badge>
                            {changelog.is_major && (
                                <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 shadow-md animate-pulse">
                                    Major Update
                                </Badge>
                            )}
                        </div>
                        <DialogTitle className="text-3xl font-black tracking-tight leading-none pt-2">
                            {changelog.title}
                        </DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground/80 font-medium pt-2">
                            We've been working hard! Here's what's new in our latest release.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[350px] pr-4 -mr-4">
                        <ChangelogItem changelog={changelog} />
                    </ScrollArea>

                    <DialogFooter className="pt-4 sm:justify-between gap-4 border-t border-dashed">
                        <Button variant="ghost" onClick={handleViewAll} className="flex-1 sm:flex-none font-bold text-muted-foreground hover:text-primary hover:bg-primary/5">
                            View All History
                        </Button>
                        <Button onClick={handleClose} className="flex-1 sm:flex-none font-black px-12 h-11 shadow-xl shadow-primary/10 hover:shadow-primary/20 scale-105 active:scale-95 transition-all">
                            Got it!
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
