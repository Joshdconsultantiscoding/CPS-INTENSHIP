"use client";

import React from "react"

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Send,
  Sparkles,
  User,
  Loader2,
  FileText,
  CheckCircle2,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const quickPrompts = [
  {
    icon: FileText,
    label: "Help with report",
    prompt: "Help me write my daily progress report for today",
  },
  {
    icon: CheckCircle2,
    label: "Task guidance",
    prompt: "How should I approach a complex coding task?",
  },
  {
    icon: BarChart3,
    label: "Performance tips",
    prompt: "What can I do to improve my performance metrics?",
  },
  {
    icon: Lightbulb,
    label: "Best practices",
    prompt: "What are some internship best practices I should follow?",
  },
];

export function AiAssistantChat() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai-assistant" }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "auto", block: "end" });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return;
    sendMessage({ text: prompt });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScrollArea className="flex-1" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center pb-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mt-6 text-xl font-semibold">
              How can I help you today?
            </h2>
            <p className="mt-2 max-w-md text-center text-muted-foreground">
              I am your AI assistant for internship management. Ask me about
              tasks, reports, performance, or anything else!
            </p>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 gap-3 w-full px-4 overflow-x-auto pb-4 sm:pb-0 scrollbar-hide">
              <div className="flex sm:grid sm:grid-cols-2 gap-3 min-w-max sm:min-w-0">
                {quickPrompts.map((item) => (
                  <Card
                    key={item.label}
                    className="cursor-pointer transition-colors hover:bg-muted/50 w-[200px] sm:w-auto shrink-0"
                    onClick={() => handleQuickPrompt(item.prompt)}
                  >
                    <CardContent className="flex items-center gap-3 p-4">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 p-6">
            {messages.map((message, idx) => (
              <div
                key={message.id || `ai-msg-${idx}`}
                className={cn(
                  "flex gap-4",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                <Avatar
                  className={cn(
                    "h-8 w-8 shrink-0",
                    message.role === "assistant" && "bg-primary"
                  )}
                >
                  <AvatarFallback
                    className={cn(
                      message.role === "assistant" &&
                      "bg-primary text-primary-foreground"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <Sparkles className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "flex-1 space-y-2",
                    message.role === "user" && "text-right"
                  )}
                >
                  <div
                    className={cn(
                      "inline-block rounded-2xl px-4 py-2.5 max-w-[85%] sm:max-w-[75%]",
                      message.role === "assistant"
                        ? "bg-muted text-foreground rounded-tl-none"
                        : "bg-primary text-primary-foreground rounded-tr-none"
                    )}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none wrap-break-word">
                      {message.parts.map((part, index) => {
                        if (part.type === "text") {
                          return (
                            <span key={index} className="whitespace-pre-wrap">
                              {part.text}
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-4">
                <Avatar className="h-8 w-8 shrink-0 bg-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4 w-full" />
          </div>
        )}
      </ScrollArea>

      <div className="border-t bg-background p-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={isLoading}
            rows={1}
            className="min-h-[44px] max-h-[200px] resize-none"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">
          AI responses may not always be accurate. Please verify important
          information.
        </p>
      </div>
    </div>
  );
}
