"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
    Send,
    Bot,
    User,
    Loader2,
    RefreshCw,
    FileText,
    Shield,
} from "lucide-react";

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: {
        authorityLayers: string[];
        globalChunks: number;
        internChunks: number;
    };
}

export default function AIChatPanel() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function handleSend() {
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const conversationHistory = messages.map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage.content,
                    conversationHistory,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `ai-${Date.now()}`,
                        role: "assistant",
                        content: data.response,
                        sources: data.sources,
                    },
                ]);
            } else {
                toast.error(data.error || "Failed to get response");
            }
        } catch (e: any) {
            toast.error(e.message || "Chat request failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="flex flex-col h-[600px]">
            <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600">
                            <Bot className="h-4 w-4 text-white" />
                        </div>
                        RAG-Powered AI Chat
                        <Badge variant="secondary" className="text-xs">Knowledge-Aware</Badge>
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMessages([])}
                        disabled={loading}
                    >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Clear
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">AI Chat with Knowledge Context</p>
                                <p className="text-xs mt-1">
                                    Ask questions and the AI will reference your uploaded documents
                                </p>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {msg.role === "assistant" && (
                                    <Avatar className="h-7 w-7 shrink-0 bg-gradient-to-br from-violet-600 to-purple-600">
                                        <AvatarFallback className="bg-transparent text-white text-xs">
                                            <Bot className="h-3.5 w-3.5" />
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div className="max-w-[80%] space-y-1">
                                    <div
                                        className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${msg.role === "user"
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                    {/* Source Citations */}
                                    {msg.sources && msg.sources.authorityLayers.length > 0 && (
                                        <div className="flex items-center gap-1 flex-wrap px-1">
                                            <Shield className="h-3 w-3 text-muted-foreground" />
                                            {msg.sources.authorityLayers.map((layer, i) => (
                                                <Badge key={i} variant="outline" className="text-[10px] h-4 px-1.5">
                                                    {layer.replace("Layer1:", "📋 ").replace("Layer2:", "👤 ").replace("Layer3:", "🎭 ")}
                                                </Badge>
                                            ))}
                                            {msg.sources.globalChunks > 0 && (
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                    <FileText className="h-2.5 w-2.5" />
                                                    {msg.sources.globalChunks} global
                                                </span>
                                            )}
                                            {msg.sources.internChunks > 0 && (
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                    <User className="h-2.5 w-2.5" />
                                                    {msg.sources.internChunks} intern
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {msg.role === "user" && (
                                    <Avatar className="h-7 w-7 shrink-0">
                                        <AvatarFallback className="bg-secondary text-xs">
                                            <User className="h-3.5 w-3.5" />
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-3">
                                <Avatar className="h-7 w-7 shrink-0 bg-gradient-to-br from-violet-600 to-purple-600">
                                    <AvatarFallback className="bg-transparent text-white text-xs">
                                        <Bot className="h-3.5 w-3.5" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="bg-muted rounded-2xl px-4 py-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* Input */}
                <div className="border-t p-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a knowledge-aware question..."
                            disabled={loading}
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={!input.trim() || loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
