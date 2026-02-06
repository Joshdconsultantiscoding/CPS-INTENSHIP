"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSyncedTime } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Send,
    ArrowLeft,
    Phone,
    Video,
    MoreVertical,
    Bot,
    Hash,
    Check,
    CheckCheck,
    Clock,
    Paperclip,
    ImageIcon,
    Mic,
    Camera,
    FileText,
    User as UserIcon,
    BarChart2,
    Calendar,
    X,
    Maximize2,
    Plus,
    Music
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, Channel } from "@/lib/types";
import { OnlineIndicator } from "./online-indicator";
import { Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VoiceRecorder } from "./voice-recorder";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface AIMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    status: "sending" | "sent" | "delivered" | "read";
}

interface ChatViewProps {
    currentUser: any;
    selectedUser: any | null;
    selectedChannel: Channel | null;
    isAIChat: boolean;
    messages: Message[];
    aiMessages: AIMessage[];
    newMessage: string;
    aiTyping: boolean;
    isUploading?: boolean;
    onSendMessage: (e?: React.FormEvent, attachmentUrl?: string, contentOverride?: string) => void;
    onNewMessageChange: (value: string) => void;
    onFileSelect?: (file: File) => void;
    onSendAttachment?: (file: File, caption: string) => void;
    onCloseChat: () => void;
    onStartCall: (type: "voice" | "video") => void;
    onViewContact?: () => void;
    onClearMessages?: () => void;
    onMute?: (muted: boolean) => void;
    isOnline?: boolean;
    onRecordingStart?: () => void;
    onRecordingEnd?: () => void;
}

function formatTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatLastSeen(dateStr: string | null | undefined): string {
    if (!dateStr) return "offline";
    const date = new Date(dateStr);
    const now = getSyncedTime();

    // Grace period: If less than 2 minutes ago, show "Just now"
    if (now.getTime() - date.getTime() < 120000) return "Just now";

    // Day comparison using normalized date strings
    const dateDay = date.toDateString();
    const nowDay = now.toDateString();

    // Check if it was yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDay = yesterday.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });

    if (dateDay === nowDay) return `today at ${timeStr}`;
    if (dateDay === yesterdayDay) return `yesterday at ${timeStr}`;

    return `${date.toLocaleDateString()} at ${timeStr}`;
}

function MessageStatus({ status, isRead }: { status: string; isRead: boolean }) {
    if (isRead || status === "read") {
        return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
    }
    if (status === "delivered") {
        return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    if (status === "sent") {
        return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    return <Clock className="h-3 w-3 text-muted-foreground/70" />;
}

function getInitials(profile: any) {
    if (profile.first_name || profile.last_name) {
        return `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase();
    }
    return profile.full_name
        ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
        : profile.email ? profile.email[0].toUpperCase() : "?";
}

export function ChatView({
    currentUser,
    selectedUser,
    selectedChannel,
    isAIChat,
    messages,
    aiMessages,
    newMessage,
    aiTyping,
    isUploading = false,
    onSendMessage,
    onNewMessageChange,
    onFileSelect,
    onSendAttachment,
    onCloseChat,
    onStartCall,
    onViewContact,
    onClearMessages,
    onMute,
    isOnline = false,
    onRecordingStart,
    onRecordingEnd,
}: ChatViewProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<{ file: File; type: string } | null>(null);
    const [attachmentCaption, setAttachmentCaption] = useState("");

    // Drag & Drop State
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget === e.target) {
            setIsDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const file = files[0];
            let type = "file";
            if (file.type.startsWith("image/")) type = "image";
            else if (file.type.startsWith("video/")) type = "video";
            else if (file.type.startsWith("audio/")) type = "audio";

            setAttachmentPreview({ file, type });
        }
    };

    const [userScrolledUp, setUserScrolledUp] = useState(false);

    const scrollToBottom = (force = false) => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

            // Scroll if forced, or if user was already near bottom
            if (force || isAtBottom || !userScrolledUp) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        }
    };

    // Detect if user scrolls up
    const handleScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
            setUserScrolledUp(!isAtBottom);
        }
    };

    // Initial scroll and new message scroll
    useEffect(() => {
        // If it's a new message from ME, force scroll. 
        // If it's from others, only scroll if at bottom.
        const lastMsg = messages[messages.length - 1];
        const isOwn = lastMsg?.sender_id === currentUser.id;

        requestAnimationFrame(() => scrollToBottom(isOwn));
    }, [messages, aiMessages.length, isRecording, aiTyping]);

    const [showPollModal, setShowPollModal] = useState(false);
    const [pollQuestion, setPollQuestion] = useState("");
    const [pollOptions, setPollOptions] = useState(["", ""]);

    const handleAddOption = () => {
        if (pollOptions.length < 5) setPollOptions([...pollOptions, ""]);
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...pollOptions];
        newOptions[index] = value;
        setPollOptions(newOptions);
    };

    const handleSendPoll = () => {
        if (!pollQuestion.trim() || pollOptions.some(o => !o.trim())) {
            toast.error("Please fill in question and at least 2 options");
            return;
        }
        const pollData = {
            question: pollQuestion,
            options: pollOptions.filter(o => o.trim())
        };
        onSendMessage(undefined, undefined, `[POLL]${JSON.stringify(pollData)}`);
        setShowPollModal(false);
        setPollQuestion("");
        setPollOptions(["", ""]);
    };

    return (
        <div
            className="flex flex-col h-full bg-linear-to-br from-[#f0f2f5] to-[#e1e5ea] dark:from-[#0b141a] dark:to-[#111b21] relative overflow-hidden"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none mix-blend-overlay bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-[length:400px_400px]"
            />

            {/* Drag Overlay */}
            <AnimatePresence>
                {isDragging && (
                    <motion.div
                        key="drag-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-primary/20 backdrop-blur-sm border-2 border-primary border-dashed m-4 rounded-xl flex items-center justify-center pointer-events-none"
                    >
                        <div className="bg-background/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl flex flex-col items-center animate-bounce">
                            <Plus className="h-12 w-12 text-primary mb-2" />
                            <p className="font-bold text-lg text-primary">Drop files to send</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Poll Modal */}
            {showPollModal && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowPollModal(false)}>
                    <div className="bg-background rounded-xl shadow-xl max-w-md w-full p-4 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">Create Poll</span>
                            <Button variant="ghost" size="icon" onClick={() => setShowPollModal(false)}><X className="h-4 w-4" /></Button>
                        </div>
                        <Input
                            placeholder="Ask a question..."
                            value={pollQuestion}
                            onChange={(e) => setPollQuestion(e.target.value)}
                            className="font-medium text-lg"
                        />
                        <div className="space-y-2">
                            {pollOptions.map((opt, i) => (
                                <Input
                                    key={i}
                                    placeholder={`Option ${i + 1}`}
                                    value={opt}
                                    onChange={(e) => handleOptionChange(i, e.target.value)}
                                />
                            ))}
                        </div>
                        {pollOptions.length < 5 && (
                            <Button variant="ghost" size="sm" onClick={handleAddOption} className="w-full text-muted-foreground border border-dashed">
                                <Plus className="h-4 w-4 mr-2" /> Add option
                            </Button>
                        )}
                        <Button onClick={handleSendPoll} className="w-full mt-2">Send Poll</Button>
                    </div>
                </div>
            )}

            {/* Chat Header */}
            <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-2 border-b border-border/40 bg-white/80 dark:bg-[#202c33]/80 backdrop-blur-xl shadow-sm">
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 md:hidden rounded-full hover:bg-muted/80" onClick={onCloseChat}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="relative shrink-0 group cursor-pointer" onClick={onViewContact}>
                    {isAIChat ? (
                        <Avatar className="h-10 w-10 bg-linear-to-tr from-primary to-primary/60 border border-white/10 ring-2 ring-primary/20">
                            <AvatarFallback className="bg-transparent text-white"><Bot className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                    ) : selectedUser ? (
                        <div className="relative">
                            <Avatar className="h-10 w-10 border border-white/10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                <AvatarImage src={selectedUser.avatar_url || ""} />
                                <AvatarFallback className="bg-slate-400 text-white text-sm">{getInitials(selectedUser)}</AvatarFallback>
                            </Avatar>
                            {selectedUser && !isAIChat && <OnlineIndicator status={isOnline ? "online" : "offline"} size="sm" className="absolute bottom-0 right-0 ring-2 ring-background" />}
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-500 flex items-center justify-center border border-white/10">
                            <Hash className="h-5 w-5 text-white" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0 pointer-events-none">
                    {selectedUser && !isAIChat ? (
                        <div className="pointer-events-auto cursor-pointer" onClick={onViewContact}>
                            <h2 className="font-bold text-sm truncate text-foreground leading-tight group-hover:text-primary transition-colors">
                                {(selectedUser?.first_name || selectedUser?.last_name)
                                    ? `${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim()
                                    : selectedUser?.full_name || selectedUser?.email}
                            </h2>
                        </div>
                    ) : (
                        <h2 className="font-bold text-sm truncate text-foreground leading-tight">
                            {isAIChat ? "HG Core Agent" : selectedChannel?.name || "Chat"}
                        </h2>
                    )}
                    <div className="flex items-center gap-1.5 h-4">
                        {aiTyping ? (
                            <span className="text-xs text-green-600 dark:text-green-400 font-bold animate-pulse">typing...</span>
                        ) : (
                            <div className="text-[10px] text-muted-foreground truncate font-medium">
                                {isAIChat ? "AI Assistant Active" : selectedUser ? (
                                    isOnline ? (
                                        <span className="text-green-500 font-bold flex items-center gap-1">
                                            Online
                                        </span>
                                    ) : (
                                        <span className="opacity-70">Last seen {formatLastSeen(selectedUser.last_seen_at)}</span>
                                    )
                                ) : "Community Group"}
                            </div>
                        )}
                    </div>
                </div>

                {selectedUser && !isAIChat && (
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-full transition-colors" onClick={() => onStartCall("video")}>
                            <Video className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-full transition-colors" onClick={() => onStartCall("voice")}>
                            <Phone className="h-5 w-5" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-full transition-colors">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-1">
                                <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={onViewContact}><UserIcon className="h-4 w-4 mr-2" /> Contact info</DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => onMute?.(true)}><Music className="h-4 w-4 mr-2" /> Mute notifications</DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={onClearMessages}><X className="h-4 w-4 mr-2" /> Clear messages</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            {/* Message Area */}
            <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 z-10 scroll-smooth">
                <AnimatePresence mode="popLayout">
                    {!isAIChat && messages.map((msg, idx) => {
                        const isOwn = msg.sender_id === currentUser.id;
                        const prevMsg = idx > 0 ? messages[idx - 1] : null;
                        const isSameSender = prevMsg?.sender_id === msg.sender_id;
                        const hasAttachments = msg.attachments && msg.attachments.length > 0;

                        // Robust Key Generation: Prefer ID, fallback to stable index-based key
                        const messageKey = (msg.id && String(msg.id).trim() !== "")
                            ? msg.id
                            : `fallback-msg-${idx}`;

                        return (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                key={messageKey}
                                className={cn("flex w-full mb-1", isOwn ? "justify-end" : "justify-start", !isSameSender && "mt-4")}
                            >
                                <div className={cn(
                                    "max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-1.5 shadow-sm relative transition-all hover:shadow-md",
                                    isOwn
                                        ? "bg-linear-to-br from-[#d9fdd3] to-[#ccfbc4] dark:from-[#005c4b] dark:to-[#004f40] rounded-tr-sm text-[#111b21] dark:text-[#e9edef] border border-[#c3fabe] dark:border-[#005c4b]"
                                        : "bg-white dark:bg-[#202c33] rounded-tl-sm text-[#111b21] dark:text-[#e9edef] border border-transparent dark:border-white/5",
                                    !isSameSender && (isOwn ? "rounded-tr-sm" : "rounded-tl-sm")
                                )}>
                                    {/* Tail (Refined) */}
                                    {!isSameSender && (
                                        <div className={cn(
                                            "absolute top-0 w-3 h-3",
                                            isOwn
                                                ? "right-[-6px] bg-[#d9fdd3] dark:bg-[#005c4b] [clip-path:polygon(0_0,0_100%,100%_0)] rounded-tl-sm"
                                                : "left-[-6px] bg-white dark:bg-[#202c33] [clip-path:polygon(100%_0,100%_100%,0_0)] rounded-tr-sm"
                                        )} />
                                    )}

                                    {/* Attachments */}
                                    {hasAttachments && (
                                        <div className="p-1 rounded-xl overflow-hidden bg-black/5 dark:bg-black/20 mb-1.5">
                                            {msg.attachments!.map((url, i) => {
                                                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes("cloudinary");
                                                if (isImage) {
                                                    return (
                                                        <div key={`att-${i}`} className="relative group/img cursor-pointer" onClick={() => setPreviewImage(url)}>
                                                            <img src={url} alt="Media" className="max-w-full h-auto rounded-lg object-contain max-h-[350px] border border-black/5" />
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                                <Maximize2 className="text-white h-8 w-8 drop-shadow-md" />
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <a href={url} target="_blank" rel="noopener noreferrer" key={`att-${i}`} className="flex items-center gap-3 p-3 bg-white/40 dark:bg-white/5 rounded-lg hover:bg-white/60 transition-colors backdrop-blur-sm">
                                                        <FileText className="h-6 w-6 text-primary" />
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-sm font-medium truncate">Document Attachment</p>
                                                        </div>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="flex items-end gap-2 px-1">
                                        {(msg.message_type === "call" || (msg as any).call_type) ? (() => {
                                            const type = (msg as any).call_type || "voice";
                                            const isMissed = (msg as any).call_status === "missed";
                                            const durationStr = (msg as any).call_duration || "00:00";
                                            const Icon = type === "video" ? Video : Phone;
                                            return (
                                                <div className="flex items-center gap-3 py-2 px-1 min-w-[180px]">
                                                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center bg-background/50 backdrop-blur-sm", isMissed ? "text-red-500" : "text-primary")}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[14px] font-bold">{isMissed ? `Missed ${type} call` : `Call ended (${durationStr})`}</span>
                                                    </div>
                                                </div>
                                            );
                                        })() : msg.content && msg.content.startsWith("[POLL]") ? (() => {
                                            try {
                                                const pollData = JSON.parse(msg.content.substring(6));
                                                return (
                                                    <div className="min-w-[220px] p-1">
                                                        <p className="font-bold text-sm mb-3 text-foreground/90">{pollData.question}</p>
                                                        <div className="space-y-2">
                                                            {pollData.options.map((opt: string, i: number) => (
                                                                <motion.button
                                                                    whileTap={{ scale: 0.98 }}
                                                                    key={`poll-${i}`}
                                                                    className="w-full text-left bg-black/5 dark:bg-white/5 p-2.5 rounded-lg text-sm hover:bg-black/10 transition-colors cursor-pointer border border-transparent hover:border-border/20 font-medium"
                                                                >
                                                                    {opt}
                                                                </motion.button>
                                                            ))}
                                                        </div>
                                                        <p className="text-[10px] opacity-60 mt-2 text-center font-bold tracking-wider uppercase">Poll</p>
                                                    </div>
                                                );
                                            } catch (e) {
                                                return <p className="text-xs text-muted-foreground">Invalid Poll</p>;
                                            }
                                        })() : msg.content && msg.content.startsWith("[CALL_LOG]:") ? (() => {
                                            const [_, type, duration] = msg.content.split(":");
                                            const isMissed = duration === "missed";
                                            const Icon = type === "video" ? Video : Phone;
                                            return (
                                                <div className="flex items-center gap-3 py-2 px-1 min-w-[180px]">
                                                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center bg-background/50", isMissed ? "text-red-500" : "text-green-500")}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[14px] font-bold">{isMissed ? `Missed ${type} call` : `${type.charAt(0).toUpperCase() + type.slice(1)} call`}</span>
                                                        {!isMissed && <span className="text-[12px] opacity-70">Duration: {(() => {
                                                            const d = parseInt(duration);
                                                            const mins = Math.floor(d / 60);
                                                            const secs = d % 60;
                                                            return `${mins}:${secs.toString().padStart(2, '0')}`;
                                                        })()}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })() : (
                                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap wrap-break-word py-0.5">{msg.content}</p>
                                        )}
                                        <div className="flex items-center gap-1 shrink-0 pb-0.5 ml-auto translate-y-[2px]">
                                            <span className="text-[10px] opacity-60 font-medium tracking-wide">{formatTime(msg.created_at)}</span>
                                            {isOwn && <MessageStatus status={msg.status || "sent"} isRead={msg.is_read} />}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    {isAIChat && aiMessages.map((msg, idx) => {
                        // Robust Key Generation for AI messages: Prefer valid ID, fallback to stable index-based key
                        const aiMessageKey = (msg.id && String(msg.id).trim() !== "")
                            ? msg.id
                            : `ai-fallback-${idx}`;
                        return (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={aiMessageKey}
                                className={cn("flex w-full mb-3", msg.role === "user" ? "justify-end" : "justify-start")}
                            >
                                <div className={cn("max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm relative", msg.role === "user" ? "bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-sm" : "bg-white dark:bg-[#202c33] rounded-tl-sm border border-transparent dark:border-white/5")}>
                                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap wrap-break-word">
                                        {msg.content.split("\n").map((line, i) => (
                                            <React.Fragment key={`line-${i}`}>
                                                {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                                                    part.startsWith("**") && part.endsWith("**")
                                                        ? <strong key={`part-${j}`}>{part.slice(2, -2)}</strong>
                                                        : <span key={`part-${j}`}>{part}</span>
                                                )}
                                                {i < msg.content.split("\n").length - 1 && <br />}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                    <div className="flex justify-end mt-1"><span className="text-[10px] opacity-60 font-bold uppercase">{formatTime(msg.timestamp)}</span></div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Layer */}
            <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-3 py-2 z-20 shadow-2xl">
                {isRecording ? (
                    <VoiceRecorder
                        onRecordingComplete={(file) => { setIsRecording(false); onRecordingEnd?.(); onFileSelect?.(file); }}
                        onCancel={() => { setIsRecording(false); onRecordingEnd?.(); }}
                    />
                ) : (
                    <div className="flex items-end gap-2 max-w-5xl mx-auto">
                        {!isAIChat && (
                            <div className="flex items-center gap-1">
                                <input type="file" id="file-upload-photo" className="hidden" accept="image/*" aria-label="Upload photo" onChange={(e) => { const f = e.target.files?.[0]; if (f) setAttachmentPreview({ file: f, type: "image" }); e.target.value = ""; }} />
                                <input type="file" id="file-upload-video" className="hidden" accept="video/*" aria-label="Upload video" onChange={(e) => { const f = e.target.files?.[0]; if (f) setAttachmentPreview({ file: f, type: "video" }); e.target.value = ""; }} />
                                <input type="file" id="file-upload-audio" className="hidden" accept="audio/*" aria-label="Upload audio" onChange={(e) => { const f = e.target.files?.[0]; if (f) setAttachmentPreview({ file: f, type: "audio" }); e.target.value = ""; }} />
                                <input type="file" id="file-upload-doc" className="hidden" accept=".pdf,.doc,.docx,.txt" aria-label="Upload document" onChange={(e) => { const f = e.target.files?.[0]; if (f) setAttachmentPreview({ file: f, type: "file" }); e.target.value = ""; }} />

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full" disabled={isUploading}>
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48">
                                        <DropdownMenuItem onClick={() => document.getElementById("file-upload-photo")?.click()}><ImageIcon className="h-4 w-4 mr-2" /> Photo</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => document.getElementById("file-upload-video")?.click()}><Video className="h-4 w-4 mr-2" /> Video</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => document.getElementById("file-upload-audio")?.click()}><Music className="h-4 w-4 mr-2" /> Audio</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => document.getElementById("file-upload-doc")?.click()}><FileText className="h-4 w-4 mr-2" /> Document</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setShowPollModal(true)}><BarChart2 className="h-4 w-4 mr-2" /> Poll</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full" onClick={() => document.getElementById("file-upload-photo")?.click()} disabled={isUploading} title="Attach image">
                                    <Paperclip className="h-5 w-5" />
                                </Button>
                            </div>
                        )}

                        <div className="flex-1 relative flex items-center bg-white dark:bg-[#2a3942] rounded-lg shadow-sm border border-black/5 dark:border-white/5 pr-2">
                            <textarea
                                rows={1}
                                value={newMessage}
                                onChange={(e) => onNewMessageChange(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendMessage(); } }}
                                placeholder="Type a message"
                                className="flex-1 bg-transparent border-0 focus:ring-0 resize-none py-2.5 px-3 text-[15px] max-h-32 min-h-[40px] outline-none"
                            />
                        </div>

                        {newMessage.trim() ? (
                            <Button onClick={() => onSendMessage()} size="icon" className="h-11 w-11 rounded-full shrink-0 bg-[#00a884] hover:bg-[#008f72] shadow-md transition-all active:scale-95">
                                <Send className="h-5 w-5 text-white" />
                            </Button>
                        ) : !isAIChat ? (
                            <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-full shrink-0 text-muted-foreground hover:bg-black/5" onClick={() => { setIsRecording(true); onRecordingStart?.(); }}>
                                <Mic className="h-6 w-6" />
                            </Button>
                        ) : (
                            <div className="w-11" /> // Maintain balance when no content in AI chat
                        )}
                    </div>
                )}
            </div>

            {/* Attachment Modals */}
            {attachmentPreview && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setAttachmentPreview(null)}>
                    <div className="bg-background rounded-xl shadow-xl max-w-md w-full p-4 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center"><span className="font-semibold">Send attachment</span><Button variant="ghost" size="icon" onClick={() => setAttachmentPreview(null)}><X className="h-4 w-4" /></Button></div>
                        <div className="min-h-[120px] rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
                            {attachmentPreview.type === "image" && attachmentPreview.file.type.startsWith("image/") && <img src={URL.createObjectURL(attachmentPreview.file)} alt="Preview" className="max-h-48 object-contain" />}
                            {attachmentPreview.type === "video" && attachmentPreview.file.type.startsWith("video/") && <video src={URL.createObjectURL(attachmentPreview.file)} controls className="max-h-48 max-w-full" />}
                            {attachmentPreview.type === "audio" && <audio src={URL.createObjectURL(attachmentPreview.file)} controls />}
                            {attachmentPreview.type === "file" && <div className="flex flex-col items-center gap-2 p-4"><FileText className="h-12 w-12 text-muted-foreground" /><span className="text-sm truncate max-w-[200px]">{attachmentPreview.file.name}</span></div>}
                        </div>
                        <Input placeholder="Add a caption..." value={attachmentCaption} onChange={(e) => setAttachmentCaption(e.target.value)} className="w-full" />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => { setAttachmentPreview(null); setAttachmentCaption(""); }}>Cancel</Button>
                            <Button onClick={() => { onSendAttachment?.(attachmentPreview.file, attachmentCaption); setAttachmentPreview(null); setAttachmentCaption(""); }} disabled={isUploading}>{isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />} Send</Button>
                        </div>
                    </div>
                </div>
            )}

            {previewImage && (
                <div className="fixed inset-0 z-100 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setPreviewImage(null)}>
                    <Button variant="ghost" size="icon" className="absolute top-6 right-6 text-white hover:bg-white/10 h-12 w-12 rounded-full z-110"><X className="h-8 w-8" /></Button>
                    <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                </div>
            )}
        </div>
    );
}
