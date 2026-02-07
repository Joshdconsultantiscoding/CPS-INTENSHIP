"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Eye, Share2 } from "lucide-react";
import { CertificateTemplate } from "./certificate-template";
import { toast } from "sonner";
import type { CourseCertificate } from "@/lib/types";

interface CertificatePreviewProps {
    certificate: CourseCertificate;
}

export function CertificatePreview({ certificate }: CertificatePreviewProps) {
    const [open, setOpen] = useState(false);

    const handleShare = async () => {
        const verifyUrl = `${window.location.origin}/verify/${certificate.id}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Certificate: ${certificate.course_title}`,
                    text: `I earned a certificate in "${certificate.course_title}" from Cospronos Media!`,
                    url: verifyUrl
                });
            } catch {
                // User cancelled or share failed
            }
        } else {
            await navigator.clipboard.writeText(verifyUrl);
            toast.success("Verification link copied to clipboard!");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" size="sm" className="flex-1 gap-2">
                    <Eye className="h-4 w-4" />
                    View
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-full h-[90vh] max-h-[90vh] overflow-y-auto flex flex-col p-0 gap-0 bg-gray-50/95 backdrop-blur-sm">
                <DialogHeader className="p-4 border-b bg-white sticky top-0 z-50">
                    <DialogTitle>Certificate Preview</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
                    <CertificateTemplate certificate={certificate} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
