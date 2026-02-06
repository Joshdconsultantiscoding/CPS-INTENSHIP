"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Award,
    Upload,
    Check,
    Loader2,
    FileUp,
    Download
} from "lucide-react";
import { toast } from "sonner";
import { issueCertificate } from "@/actions/classroom-advanced";

interface CertificateIssuerProps {
    userId: string;
    courseId: string;
    internName: string;
    courseTitle: string;
}

export function CertificateIssuer({ userId, courseId, internName, courseTitle }: CertificateIssuerProps) {
    const [open, setOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [issuerType, setIssuerType] = useState<'system' | 'upload'>('system');

    const handleIssue = async () => {
        setIsUploading(true);
        try {
            await issueCertificate({
                userId,
                courseId,
                type: issuerType,
                customUrl: fileUrl
            });
            toast.success(`Certificate issued to ${internName}!`);
            setOpen(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-primary hover:text-primary hover:bg-primary/5 border-primary/20">
                    <Award className="mr-2 h-4 w-4" />
                    Issue Certificate
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Issue Certificate</DialogTitle>
                    <DialogDescription>
                        Confirm completion for {internName} and provide their certificate.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant={issuerType === 'system' ? 'default' : 'outline'}
                            className="flex flex-col h-24 gap-2"
                            onClick={() => setIssuerType('system')}
                        >
                            <Award className="h-6 w-6" />
                            <span className="text-xs">System Generated</span>
                        </Button>
                        <Button
                            variant={issuerType === 'upload' ? 'default' : 'outline'}
                            className="flex flex-col h-24 gap-2"
                            onClick={() => setIssuerType('upload')}
                        >
                            <Upload className="h-6 w-6" />
                            <span className="text-xs">Custom Upload</span>
                        </Button>
                    </div>

                    {issuerType === 'upload' && (
                        <div className="space-y-4 animate-in fade-in-50 duration-300">
                            <div className="space-y-2">
                                <Label className="text-xs">Certificate PDF/Image URL</Label>
                                <Input
                                    placeholder="https://..."
                                    value={fileUrl || ''}
                                    onChange={(e) => setFileUrl(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Upload the certificate to a secure storage and paste the URL here.
                                </p>
                            </div>
                        </div>
                    )}

                    {issuerType === 'system' && (
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center space-y-2 animate-in fade-in-50 duration-300">
                            <Check className="h-8 w-8 text-primary mx-auto" />
                            <p className="text-sm font-medium">Auto-Generation Enabled</p>
                            <p className="text-xs text-muted-foreground">
                                The system will generate a standard certificate with the intern's name, course title, and completion date.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleIssue} disabled={isUploading}>
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Finalize & Issue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
