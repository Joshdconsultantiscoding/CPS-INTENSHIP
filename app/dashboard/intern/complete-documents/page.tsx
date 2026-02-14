"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileUp, CheckCircle2, AlertCircle, Loader2, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { saveDocumentDraft, submitAllDocuments, getInternDocumentsStatus } from "@/app/actions/intern-docs";
import { Badge } from "@/components/ui/badge";

const REQUIRED_DOCS = [
    { id: "learning_plan_url", label: "Learning Plan", description: "Your structured goals and learning track for the internship." },
    { id: "expectation_plan_url", label: "Expectation Plan", description: "What you expect from the program and your personal growth targets." },
    { id: "earning_plan_url", label: "Earning Plan", description: "Your financial or point-based goals and milestone expectations." },
    { id: "internship_plan_url", label: "Comprehensive Internship Plan", description: "The master agreement and detailed roadmap for your entire duration." },
] as const;

export default function CompleteDocumentsPage() {
    const [status, setStatus] = useState<any>(null);
    const [uploading, setUploading] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await getInternDocumentsStatus();
                setStatus(data);
            } catch (e) {
                toast.error("Failed to load document status");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const handleUpload = async (field: typeof REQUIRED_DOCS[number]["id"], e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            toast.error("Only PDF files are allowed");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB");
            return;
        }

        setUploading(field);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();

            await saveDocumentDraft({ field, url: data.secure_url });

            setStatus((prev: any) => ({ ...prev, [field]: data.secure_url }));
            toast.success(`${field.replace("_url", "").replace("_", " ")} uploaded successfully`);
        } catch (error) {
            toast.error("Upload failed. Please try again.");
        } finally {
            setUploading(null);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await submitAllDocuments();
            toast.success("All documents submitted! Redirecting to dashboard...");
            window.location.href = "/dashboard";
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const uploadedCount = REQUIRED_DOCS.filter(doc => !!status[doc.id]).length;
    const progress = (uploadedCount / REQUIRED_DOCS.length) * 100;
    const allUploaded = uploadedCount === REQUIRED_DOCS.length;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Complete Your Enrollment</h1>
                <p className="text-muted-foreground text-lg">
                    Before accessing the dashboard, you must upload 4 mandatory internship documents.
                </p>
            </div>

            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Compliance Progress</span>
                        <span className="text-sm font-medium">{uploadedCount} of 4 Complete</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                </CardContent>
            </Card>

            <div className="grid gap-6">
                {REQUIRED_DOCS.map((doc) => {
                    const isUploaded = !!status[doc.id];
                    const isUploading = uploading === doc.id;

                    return (
                        <Card key={doc.id} className={isUploaded ? "border-green-500/50 bg-green-500/5" : ""}>
                            <CardHeader className="pb-3 px-6 pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            {isUploaded ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <FileText className="h-5 w-5 text-primary" />}
                                            {doc.label}
                                        </CardTitle>
                                        <CardDescription>{doc.description}</CardDescription>
                                    </div>
                                    {isUploaded && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                                            Uploaded
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="px-6 pb-6">
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    {isUploaded ? (
                                        <>
                                            <Button variant="outline" className="w-full sm:w-auto" asChild>
                                                <a href={status[doc.id]} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    View Document
                                                </a>
                                            </Button>
                                            <div className="flex-1 w-full sm:w-auto">
                                                <label className="block w-full">
                                                    <span className="sr-only">Choose File</span>
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={(e) => handleUpload(doc.id, e)}
                                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                                                        disabled={isUploading || isSubmitting}
                                                    />
                                                </label>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full relative">
                                            <input
                                                type="file"
                                                id={`upload-${doc.id}`}
                                                accept=".pdf"
                                                className="hidden"
                                                onChange={(e) => handleUpload(doc.id, e)}
                                                disabled={isUploading || isSubmitting}
                                            />
                                            <label
                                                htmlFor={`upload-${doc.id}`}
                                                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors hover:bg-muted/50 ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                                ) : (
                                                    <FileUp className="h-8 w-8 text-muted-foreground mb-2" />
                                                )}
                                                <p className="text-sm font-medium">{isUploading ? 'Uploading...' : 'Click to select PDF or drag and drop'}</p>
                                                <p className="text-xs text-muted-foreground mt-1">Maximum size 10MB</p>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="pt-6 border-t flex flex-col items-center gap-4">
                {!allUploaded && (
                    <div className="flex items-center text-amber-600 gap-2 text-sm font-medium bg-amber-50 px-4 py-2 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        All 4 documents must be uploaded before final submission.
                    </div>
                )}
                <Button
                    size="lg"
                    className="w-full sm:w-64 h-12 text-lg rounded-xl"
                    disabled={!allUploaded || isSubmitting}
                    onClick={handleSubmit}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Finalizing...
                        </>
                    ) : (
                        "Submit All Documents"
                    )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                    By submitting, you confirm that the documents are accurate and complete.
                    Misleading information may lead to program termination.
                </p>
            </div>
        </div>
    );
}
