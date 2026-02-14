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
    User,
    Users,
} from "lucide-react";

interface InternProfile {
    id: string;
    full_name: string | null;
    email: string;
}

interface KnowledgeDoc {
    id: string;
    title: string;
    file_name: string;
    doc_type: string;
    intern_id: string;
    status: string;
    chunk_count: number;
    file_size_bytes: number;
    error_message: string | null;
    created_at: string;
}

const INTERN_DOC_TYPES = [
    { value: "learning_plan", label: "Learning Plan" },
    { value: "expectation_plan", label: "Expectation Plan" },
    { value: "earning_plan", label: "Earning Plan" },
    { value: "comprehensive_plan", label: "Comprehensive Internship Plan" },
    { value: "other", label: "Other Document" },
];

export default function InternDocumentUpload() {
    const [interns, setInterns] = useState<InternProfile[]>([]);
    const [selectedIntern, setSelectedIntern] = useState("");
    const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [title, setTitle] = useState("");
    const [docType, setDocType] = useState("learning_plan");
    const [file, setFile] = useState<File | null>(null);

    // Fetch interns list
    useEffect(() => {
        async function fetchInterns() {
            try {
                const res = await fetch("/api/profiles?role=intern");
                if (res.ok) {
                    const data = await res.json();
                    setInterns(data.profiles || data || []);
                }
            } catch (e) {
                // Fallback: try Supabase direct
                console.error("Failed to fetch interns:", e);
            } finally {
                setLoading(false);
            }
        }
        fetchInterns();
    }, []);

    const fetchDocuments = useCallback(async () => {
        if (!selectedIntern) return;
        try {
            const res = await fetch(`/api/ai/documents?scope=intern&intern_id=${selectedIntern}`);
            if (res.ok) {
                const data = await res.json();
                setDocuments(data.documents || []);
            }
        } catch (e) {
            console.error("Failed to fetch documents:", e);
        }
    }, [selectedIntern]);

    useEffect(() => {
        if (selectedIntern) fetchDocuments();
    }, [selectedIntern, fetchDocuments]);

    async function handleUpload() {
        if (!file || !title.trim() || !selectedIntern) {
            toast.error("Select an intern, provide a title, and choose a file");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("title", title.trim());
            formData.append("doc_scope", "intern");
            formData.append("doc_type", docType);
            formData.append("intern_id", selectedIntern);

            const res = await fetch("/api/ai/documents/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(`Document indexed: ${data.chunk_count} chunks`);
                setTitle("");
                setFile(null);
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
        if (!confirm("Delete this document?")) return;
        try {
            const res = await fetch(`/api/ai/documents?id=${docId}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Document deleted");
                fetchDocuments();
            }
        } catch (e: any) {
            toast.error("Delete failed");
        }
    }

    const selectedInternName = interns.find(i => i.id === selectedIntern)?.full_name || "Select an intern";

    return (
        <div className="space-y-6">
            {/* Intern Selector */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Per-Intern Document Management
                    </CardTitle>
                    <CardDescription>
                        Upload learning plans, expectation plans, and earning plans for individual interns
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Select Intern</Label>
                        <Select value={selectedIntern} onValueChange={setSelectedIntern}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose an intern..." />
                            </SelectTrigger>
                            <SelectContent>
                                {interns.map((intern) => (
                                    <SelectItem key={intern.id} value={intern.id}>
                                        <div className="flex items-center gap-2">
                                            <User className="h-3 w-3" />
                                            {intern.full_name || intern.email}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {selectedIntern && (
                <>
                    {/* Upload Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Upload Document for {selectedInternName}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Document Title</Label>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., Learning Plan - Animation Track"
                                        disabled={uploading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Document Type</Label>
                                    <Select value={docType} onValueChange={setDocType} disabled={uploading}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {INTERN_DOC_TYPES.map((dt) => (
                                                <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
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
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                                ) : (
                                    <><Upload className="h-4 w-4 mr-2" />Upload & Index</>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Existing Documents for Selected Intern */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Documents for {selectedInternName}</CardTitle>
                            <CardDescription>{documents.length} document(s)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {documents.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground">
                                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No documents uploaded for this intern</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <FileText className="h-6 w-6 shrink-0 text-muted-foreground" />
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate text-sm">{doc.title}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant={doc.status === "indexed" ? "default" : "secondary"} className="text-xs">
                                                            {doc.status === "indexed" ? (
                                                                <><CheckCircle2 className="h-3 w-3 mr-1" />{doc.chunk_count} chunks</>
                                                            ) : doc.status === "error" ? (
                                                                <><AlertCircle className="h-3 w-3 mr-1" />Error</>
                                                            ) : (
                                                                <><Clock className="h-3 w-3 mr-1" />{doc.status}</>
                                                            )}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {doc.doc_type.replace(/_/g, " ")}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
