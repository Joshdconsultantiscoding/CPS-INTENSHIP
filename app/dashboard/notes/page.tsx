"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Plus,
    Search,
    Trash2,
    Pin,
    MoreVertical,
    FileText,
    Loader2,
    Calendar,
    ArrowLeft,
    CheckCircle2,
    Paperclip,
    X,
    FileIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CldUploadWidget } from 'next-cloudinary';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getNotesAction, createNoteAction, updateNoteAction, deleteNoteAction, type Note } from "./actions";

export default function NotesPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Editor state
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [attachments, setAttachments] = useState<string[]>([]);

    // --- Refs to avoid stale closures ---
    const notesRef = useRef<Note[]>(notes);
    const selectedNoteIdRef = useRef<string | null>(selectedNoteId);
    const titleRef = useRef(title);
    const contentRef = useRef(content);
    const attachmentsRef = useRef<string[]>(attachments);
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const idMappingRef = useRef<Record<string, string>>({});

    // Keep refs in sync with state
    useEffect(() => { notesRef.current = notes; }, [notes]);
    useEffect(() => { selectedNoteIdRef.current = selectedNoteId; }, [selectedNoteId]);
    useEffect(() => { titleRef.current = title; }, [title]);
    useEffect(() => { contentRef.current = content; }, [content]);
    useEffect(() => { attachmentsRef.current = attachments; }, [attachments]);

    // Initial fetch and Local Storage Load
    useEffect(() => {
        // 1. Load from local storage for instant access
        try {
            const cached = localStorage.getItem("notes-cache");
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) {
                    setNotes(parsed);
                    if (parsed.length > 0) setLoading(false);
                }
            }
        } catch (e) {
            console.error("Failed to parse local notes", e);
        }

        // 2. Fetch from server to sync
        loadNotes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync to local storage on every change (including empty array to clear stale cache)
    useEffect(() => {
        localStorage.setItem("notes-cache", JSON.stringify(notes));
    }, [notes]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && selectedNoteIdRef.current) {
                setSelectedNoteId(null);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                const noteId = selectedNoteIdRef.current;
                if (noteId) {
                    // Actually trigger a real save
                    doAutoSave(noteId, titleRef.current, contentRef.current, attachmentsRef.current);
                    toast.success("Note saved", { id: "manual-save" });
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadNotes = async () => {
        setLoading(true);
        try {
            const res = await getNotesAction();
            if (res.success && res.data) {
                setNotes(prev => {
                    // Keep optimistic notes that are still being created
                    const optimisticNotes = prev.filter(n => n.id.startsWith("temp-"));

                    // Filter server notes to avoid duplicates if mapping just finished
                    const serverNotes = res.data!.filter(sn =>
                        !optimisticNotes.some(tn => idMappingRef.current[tn.id] === sn.id)
                    );

                    const merged = [...optimisticNotes, ...serverNotes];

                    // Select first note if nothing is selected
                    if (!selectedNoteIdRef.current && merged.length > 0) {
                        selectNote(merged[0]);
                    }

                    return merged;
                });
            } else if (res.error === "Unauthorized") {
                toast.error("Session expired. Please sign in again.");
            } else {
                if (notesRef.current.length === 0) toast.error("Failed to load notes");
                console.error(res.error);
            }
        } catch (e) {
            console.error("Load notes error:", e);
        }
        setLoading(false);
    };

    const selectNote = (note: Note) => {
        setSelectedNoteId(note.id);
        setTitle(note.title || "");
        setContent(note.content || "");
        setAttachments(note.attachments || []);
    };

    const handleCreateNote = async () => {
        const tempId = "temp-" + Date.now();
        const newNote: Note = {
            id: tempId,
            title: "Untitled Note",
            content: "",
            source: "manual",
            is_pinned: false,
            attachments: [],
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        // Optimistic update — use functional setState to avoid stale closure
        setNotes(prev => [newNote, ...prev]);
        selectNote(newNote);

        const res = await createNoteAction("Untitled Note", "");
        if (res.success && res.data) {
            // Record mapping for any pending auto-saves
            idMappingRef.current[tempId] = res.data.id;

            // Replace temp note with real one
            setNotes(prev => prev.map(n => n.id === tempId ? res.data! : n));
            setSelectedNoteId(res.data.id);
        } else {
            toast.error(res.error || "Failed to create note");
            setNotes(prev => prev.filter(n => n.id !== tempId));
        }
    };

    const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!confirm("Are you sure you want to delete this note?")) return;

        setNotes(prev => {
            const remaining = prev.filter(n => n.id !== id);
            return remaining;
        });
        if (selectedNoteIdRef.current === id) {
            setSelectedNoteId(null);
            setTitle("");
            setContent("");
            setAttachments([]);
        }

        if (id.startsWith("temp-")) {
            toast.success("Note removed");
            return;
        }

        const res = await deleteNoteAction(id);
        if (!res.success) {
            toast.error(res.error || "Failed to delete note");
            // Reload notes to restore state
            loadNotes();
        } else {
            toast.success("Note deleted");
        }
    };

    const handlePinNote = async (id: string, currentPin: boolean, e?: React.MouseEvent) => {
        e?.stopPropagation();

        // Optimistic update using functional setState
        setNotes(prev => prev.map(n => n.id === id ? { ...n, is_pinned: !currentPin } : n));

        // Guard: skip server call for temp notes
        if (id.startsWith("temp-")) return;

        // Resolve real ID if there's a mapping
        let targetId = id;
        if (idMappingRef.current[id]) {
            targetId = idMappingRef.current[id];
        }

        const res = await updateNoteAction(targetId, { is_pinned: !currentPin });
        if (!res.success) {
            // Revert on failure
            setNotes(prev => prev.map(n => n.id === id ? { ...n, is_pinned: currentPin } : n));
            toast.error("Failed to pin note");
        }
    };

    // --- Auto-save logic ---
    const doAutoSave = useCallback(async (id: string, t: string, c: string, att: string[]) => {
        // Resolve real ID if available
        let targetId = id;
        if (idMappingRef.current[id]) {
            targetId = idMappingRef.current[id];
        }

        // If still temp ID, skip — note creation is still in progress
        if (targetId.startsWith("temp-")) {
            // Retry after a short delay
            setTimeout(() => {
                doAutoSave(id, t, c, att);
            }, 500);
            return;
        }

        // Check if note still exists using ref (always fresh)
        if (!notesRef.current.some(n => n.id === id || n.id === targetId)) {
            setSaving(false);
            return;
        }

        // Update local list preview immediately
        setNotes(prev =>
            prev.map(n =>
                (n.id === id || n.id === targetId)
                    ? { ...n, title: t, content: c, attachments: att, updated_at: new Date().toISOString() }
                    : n
            )
        );

        const res = await updateNoteAction(targetId, { title: t, content: c, attachments: att });
        if (!res.success) {
            console.error("Auto-save failed:", res.error);
            toast.error("Auto-save failed", { id: "autosave-error" });
        }
        setSaving(false);
    }, []);

    const triggerAutoSave = useCallback((id: string, t: string, c: string, att: string[]) => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        setSaving(true);

        saveTimerRef.current = setTimeout(() => {
            doAutoSave(id, t, c, att);
        }, 1000);
    }, [doAutoSave]);

    const handleContentChange = (newContent: string) => {
        setContent(newContent);
        if (selectedNoteIdRef.current) {
            triggerAutoSave(selectedNoteIdRef.current, titleRef.current, newContent, attachmentsRef.current);
        }
    };

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        if (selectedNoteIdRef.current) {
            triggerAutoSave(selectedNoteIdRef.current, newTitle, contentRef.current, attachmentsRef.current);
        }
    };

    const handleAddAttachment = (url: string) => {
        const newAttachments = [...attachmentsRef.current, url];
        setAttachments(newAttachments);
        if (selectedNoteIdRef.current) {
            triggerAutoSave(selectedNoteIdRef.current, titleRef.current, contentRef.current, newAttachments);
        }
    };

    const handleRemoveAttachment = (index: number) => {
        const newAttachments = attachmentsRef.current.filter((_, i) => i !== index);
        setAttachments(newAttachments);
        if (selectedNoteIdRef.current) {
            triggerAutoSave(selectedNoteIdRef.current, titleRef.current, contentRef.current, newAttachments);
        }
    };

    const filteredNotes = notes.filter(n =>
        (n.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.content || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
    const otherNotes = filteredNotes.filter(n => !n.is_pinned);

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-background">
            {/* Sidebar List */}
            <div className={cn("w-full md:w-80 border-r bg-muted/10 flex-col", selectedNoteId ? "hidden md:flex" : "flex")}>
                <div className="p-4 border-b space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-xl">Notes</h2>
                        <Button size="icon" variant="ghost" onClick={handleCreateNote}>
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search notes..."
                            className="pl-9 bg-background"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-6">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                    ) : (
                        <>
                            {pinnedNotes.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-2 uppercase tracking-wider">Pinned</h3>
                                    <div className="space-y-1">
                                        {pinnedNotes.map(note => (
                                            <NoteItem
                                                key={note.id}
                                                note={note}
                                                isSelected={selectedNoteId === note.id}
                                                onClick={() => selectNote(note)}
                                                onDelete={(e) => handleDeleteNote(note.id, e)}
                                                onPin={(e) => handlePinNote(note.id, note.is_pinned, e)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {otherNotes.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-2 uppercase tracking-wider">All Notes</h3>
                                    <div className="space-y-1">
                                        {otherNotes.map(note => (
                                            <NoteItem
                                                key={note.id}
                                                note={note}
                                                isSelected={selectedNoteId === note.id}
                                                onClick={() => selectNote(note)}
                                                onDelete={(e) => handleDeleteNote(note.id, e)}
                                                onPin={(e) => handlePinNote(note.id, note.is_pinned, e)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {filteredNotes.length === 0 && (
                                <div className="text-center text-muted-foreground p-8 text-sm">
                                    No notes found. Create one to get started!
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Main Editor */}
            <div className={cn("flex-1 flex-col bg-background/50", !selectedNoteId ? "hidden md:flex" : "flex")}>
                {selectedNoteId ? (
                    <>
                        <div className="border-b px-4 md:px-8 py-4 flex items-center justify-between bg-background">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Button variant="ghost" size="icon" className="md:hidden -ml-2 h-8 w-8" onClick={() => setSelectedNoteId(null)}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <Calendar className="h-4 w-4 hidden sm:block" />
                                <span>{new Date().toLocaleDateString()}</span>
                                <span className="mx-1">•</span>
                                {saving ? (
                                    <span className="flex items-center gap-1.5 animate-pulse">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Syncing...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-emerald-500">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Synced
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <CldUploadWidget
                                    uploadPreset="ml_default"
                                    options={{
                                        maxFileSize: 5242880, // 5 MB limit
                                        resourceType: "auto",
                                        clientAllowedFormats: [
                                            "jpg", "jpeg", "png", "gif", "webp", "svg",
                                            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"
                                        ],
                                        maxFiles: 5,
                                        sources: ["local", "url", "camera"],
                                    }}
                                    onSuccess={(result) => {
                                        const info = result.info as any;
                                        if (info?.secure_url) {
                                            handleAddAttachment(info.secure_url);
                                            toast.success("File attached");
                                        }
                                    }}
                                    onError={(error) => {
                                        console.error("Cloudinary upload error:", error);
                                        toast.error("Upload failed. Files must be under 5MB.");
                                    }}
                                >
                                    {({ open }) => (
                                        <Button variant="ghost" size="icon" onClick={() => open()}>
                                            <Paperclip className="h-4 w-4" />
                                        </Button>
                                    )}
                                </CldUploadWidget>
                                <Button variant="ghost" size="icon" onClick={(e) => handlePinNote(selectedNoteId, notes.find(n => n.id === selectedNoteId)?.is_pinned || false)}>
                                    <Pin className={cn("h-4 w-4", notes.find(n => n.id === selectedNoteId)?.is_pinned && "fill-primary text-primary")} />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteNote(selectedNoteId)}><Trash2 className="h-4 w-4 mr-2" /> Delete Note</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col max-w-3xl mx-auto w-full px-4 md:px-8 py-6">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="Note Title"
                                className="text-3xl md:text-4xl font-bold bg-transparent border-none focus:ring-0 px-0 placeholder:text-muted-foreground/40 mb-2 w-full"
                            />

                            {/* Attachments Section */}
                            {attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {attachments.map((url, index) => (
                                        <div key={index} className="relative group/att w-20 h-20 rounded-lg border bg-muted overflow-hidden">
                                            {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                <img src={url} alt="attachment" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <FileIcon className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleRemoveAttachment(index)}
                                                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover/att:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <textarea
                                value={content}
                                onChange={(e) => handleContentChange(e.target.value)}
                                placeholder="Start typing..."
                                className="flex-1 w-full bg-transparent border-none focus:ring-0 resize-none px-0 text-base md:text-lg leading-relaxed placeholder:text-muted-foreground/30 focus:outline-none"
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12">
                        <div className="relative mb-8">
                            <FileText className="h-24 w-24 opacity-10" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Plus className="h-8 w-8 opacity-20 animate-pulse" />
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">No note selected</h3>
                        <p className="text-center max-w-xs text-muted-foreground">
                            Choose a note from the sidebar or click the plus button to start writing your ideas.
                        </p>
                        <Button variant="outline" className="mt-6" onClick={handleCreateNote}>
                            <Plus className="h-4 w-4 mr-2" /> New Note
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

function NoteItem({
    note,
    isSelected,
    onClick,
    onDelete,
    onPin
}: {
    note: Note;
    isSelected: boolean;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
    onPin: (e: React.MouseEvent) => void;
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group flex flex-col gap-1 p-3 rounded-lg cursor-pointer transition-all border border-transparent",
                isSelected ? "bg-background shadow-md border-border/50" : "hover:bg-background/50 hover:border-border/20"
            )}
        >
            <div className="flex items-start justify-between">
                <h4 className={cn("font-medium text-sm truncate pr-2", isSelected ? "text-primary" : "text-foreground")}>
                    {note.title || "Untitled Note"}
                </h4>
                {note.is_pinned && <Pin className="h-3 w-3 text-primary fill-primary shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate h-4">
                {note.content || "No content"}
            </p>
            <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-muted text-muted-foreground"
                        onClick={onPin}
                        title={note.is_pinned ? "Unpin" : "Pin"}
                    >
                        <Pin className={cn("h-3 w-3", note.is_pinned && "fill-primary text-primary")} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-red-100 hover:text-red-500 text-muted-foreground"
                        onClick={onDelete}
                        title="Delete"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
