"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
    Upload,
    FileText,
    Loader2,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Clock,
    Shield,
    Database,
} from "lucide-react";

interface KnowledgeDoc {
    id: string;
    title: string;
    file_name: string;
    doc_type: string;
    doc_scope: string;
    authority_level: number;
    status: string;
    chunk_count: number;
    file_size_bytes: number;
    error_message: string | null;
    created_at: string;
}

const DOC_TYPES = [
    { value: "internship_plan", label: "Internship Plan (Primary Authority)" },
    { value: "internship_agreement", label: "Internship Agreement (Legal Authority)" },
    { value: "qa_document", label: "Q&A Document (Behavioral Clarification)" },
    { value: "other", label: "Other Document" },
];

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case "indexed":
            return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Indexed</Badge>;
        case "processing":
            return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
        case "error":
            return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
        default:
            return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
}

export default function GlobalKnowledgeUpload() {
    const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [title, setTitle] = useState("");
    const [docType, setDocType] = useState("internship_plan");
    const [file, setFile] = useState<File | null>(null);

    const fetchDocuments = useCallback(async () => {
        try {
            const res = await fetch("/api/ai/documents?scope=global");
            if (res.ok) {
                const data = await res.json();
                setDocuments(data.documents || []);
            }
        } catch (e) {
            console.error("Failed to fetch documents:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    async function handleUpload() {
        if (!file || !title.trim()) {
            toast.error("Please provide a title and select a file");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("title", title.trim());
            formData.append("doc_scope", "global");
            formData.append("doc_type", docType);

            const res = await fetch("/api/ai/documents/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success(`Document indexed: ${data.chunk_count} chunks created`);
                setTitle("");
                setFile(null);
                setDocType("internship_plan");
                fetchDocuments();
            } else {
                toast.error(data.error || "Upload failed");
            }
        } catch (e: any) {
            toast.error(e.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(docId: string) {
        if (!confirm("Delete this document and all its indexed chunks?")) return;

        try {
            const res = await fetch(`/api/ai/documents?id=${docId}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Document deleted");
                fetchDocuments();
            } else {
                const data = await res.json();
                toast.error(data.error || "Delete failed");
            }
        } catch (e: any) {
            toast.error(e.message || "Delete failed");
        }
    }

    return (
        <div className="space-y-6">
            {/* Upload Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Upload Global Master Documents
                    </CardTitle>
                    <CardDescription>
                        These documents form the highest authority layer. Upload your Internship Plan, Agreement, and Q&A documents.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Document Title</Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Internship Plan 2025"
                                disabled={uploading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Document Type</Label>
                            <Select value={docType} onValueChange={setDocType} disabled={uploading}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DOC_TYPES.map((dt) => (
                                        <SelectItem key={dt.value} value={dt.value}>
                                            {dt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>File (PDF, DOCX, TXT, MD)</Label>
                        <Input
                            type="file"
                            accept=".pdf,.docx,.txt,.md"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            disabled={uploading}
                        />
                    </div>

                    <Button onClick={handleUpload} disabled={uploading || !file || !title.trim()}>
                        {uploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload & Index
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Existing Documents */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Indexed Global Documents
                    </CardTitle>
                    <CardDescription>
                        {documents.length} document(s) in the global knowledge base
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>No documents uploaded yet</p>
                            <p className="text-xs">Upload your Internship Plan to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{doc.title}</p>
                                            <div className="flex items-center gap-2 flex-wrap mt-1">
                                                <StatusBadge status={doc.status} />
                                                <Badge variant="outline" className="text-xs">
                                                    {doc.doc_type.replace(/_/g, " ")}
                                                </Badge>
                                                {doc.chunk_count > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {doc.chunk_count} chunks
                                                    </span>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {(doc.file_size_bytes / 1024).toFixed(0)}KB
                                                </span>
                                            </div>
                                            {doc.error_message && (
                                                <p className="text-xs text-destructive mt-1">{doc.error_message}</p>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(doc.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
