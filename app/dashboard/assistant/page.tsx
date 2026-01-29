"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Bot,
  Send,
  User,
  Sparkles,
  FileText,
  Target,
  Clock,
  HelpCircle,
  AlertTriangle,
  Award,
  MessageSquare,
  Search,
  BookOpen,
  Zap,
  RefreshCw,
  Loader2,
  ChevronRight,
} from "lucide-react";
import {
  HG_CORE_KNOWLEDGE,
  searchKnowledge,
  generateResponse,
  getGreeting,
  type KnowledgeEntry,
} from "@/lib/hg-core-knowledge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const QUICK_TOPICS = [
  { icon: FileText, label: "Daily Reports", query: "How should I write my daily report?", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { icon: Target, label: "Tasks", query: "How do tasks work?", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { icon: Award, label: "Points", query: "How do I earn points?", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { icon: Clock, label: "Routine", query: "What should my daily routine look like?", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { icon: AlertTriangle, label: "No Power", query: "What if I have no power?", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  { icon: HelpCircle, label: "Warnings", query: "What happens when I get a warning?", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  { icon: MessageSquare, label: "Communication", query: "Why can't we use WhatsApp?", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
  { icon: BookOpen, label: "Success", query: "What habits should I develop?", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Platform Foundation": "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  "Daily Operations": "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  "Task Management": "bg-lime-100 text-lime-700 dark:bg-lime-900/50 dark:text-lime-300",
  "Daily Reports": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  "Performance Scoring": "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  "Reward System": "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  "Warning System": "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  "Technical Challenges": "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
  "Success Principles": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  FAQ: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KnowledgeEntry[]>([]);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [suggestions, setSuggestions] = useState<KnowledgeEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "auto", block: "end" });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content: getGreeting(),
          timestamp: new Date(),
        },
      ]);
    }
  }, [messages.length]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchKnowledge(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (input.trim().length > 2) {
      const results = searchKnowledge(input);
      setSuggestions(results.slice(0, 3));
    } else {
      setSuggestions([]);
    }
  }, [input]);

  const streamResponse = useCallback((fullText: string, messageId: string) => {
    const words = fullText.split(" ");
    let currentIndex = 0;

    const intervalId = setInterval(() => {
      if (currentIndex < words.length) {
        const chunk = words.slice(0, currentIndex + 1).join(" ");
        setStreamingText(chunk);
        currentIndex++;
      } else {
        clearInterval(intervalId);
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, content: fullText, isStreaming: false } : m))
        );
        setStreamingText("");
        setIsTyping(false);
      }
    }, 30);

    return intervalId;
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const assistantMessageId = `assistant-${Date.now()}`;
    const placeholderMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, placeholderMessage]);
    setInput("");
    setSuggestions([]);
    setIsTyping(true);

    setTimeout(() => {
      const response = generateResponse(userMessage.content);
      streamResponse(response, assistantMessageId);
    }, 300);
  };

  const handleQuickTopic = (query: string) => {
    if (isTyping) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    const assistantMessageId = `assistant-${Date.now()}`;
    const placeholderMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, placeholderMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const response = generateResponse(query);
      streamResponse(response, assistantMessageId);
    }, 300);
  };

  const handleKnowledgeEntryClick = (entry: KnowledgeEntry) => {
    const query = entry.question || entry.title;
    handleQuickTopic(query);
    setShowKnowledgeBase(false);
    setSearchQuery("");
  };

  const clearChat = () => {
    setMessages([
      {
        id: "greeting-new",
        role: "assistant",
        content: getGreeting(),
        timestamp: new Date(),
      },
    ]);
  };

  const categories = [...new Set(HG_CORE_KNOWLEDGE.map((e) => e.category))];

  const renderMessageContent = (content: string, isStreaming?: boolean) => {
    const displayContent = isStreaming ? streamingText : content;

    return (
      <div className="text-sm whitespace-pre-wrap">
        {displayContent.split("\n").map((line, i) => {
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <React.Fragment key={i}>
              {parts.map((part, j) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return <strong key={j}>{part.slice(2, -2)}</strong>;
                }
                return <span key={j}>{part}</span>;
              })}
              {i < displayContent.split("\n").length - 1 && <br />}
            </React.Fragment>
          );
        })}
        {isStreaming && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />}
      </div>
    );
  };

  // Knowledge Base Sheet Content
  const KnowledgeBaseContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {searchQuery.trim() ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-2">{searchResults.length} result(s)</p>
              {searchResults.map((entry) => (
                <Card
                  key={entry.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors active:scale-[0.98]"
                  onClick={() => handleKnowledgeEntryClick(entry)}
                >
                  <CardContent className="p-3">
                    <Badge variant="secondary" className={`text-xs mb-2 ${CATEGORY_COLORS[entry.category] || ""}`}>
                      {entry.category}
                    </Badge>
                    <p className="text-sm font-medium">{entry.title}</p>
                    {entry.question && <p className="text-xs text-muted-foreground mt-1">{entry.question}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Browse by category ({HG_CORE_KNOWLEDGE.length} articles):</p>
              {categories.map((category) => {
                const entries = HG_CORE_KNOWLEDGE.filter((e) => e.category === category);
                return (
                  <div key={category}>
                    <Badge variant="secondary" className={`text-xs mb-2 ${CATEGORY_COLORS[category] || ""}`}>
                      {category} ({entries.length})
                    </Badge>
                    <div className="space-y-1 ml-2">
                      {entries.slice(0, 3).map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => handleKnowledgeEntryClick(entry)}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full text-left py-1 active:scale-[0.98]"
                        >
                          <ChevronRight className="h-3 w-3 shrink-0" />
                          <span className="truncate">{entry.title}</span>
                        </button>
                      ))}
                      {entries.length > 3 && (
                        <p className="text-xs text-muted-foreground ml-5">+{entries.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b px-4 py-3 md:px-6 md:py-4 bg-linear-to-r from-primary/5 via-transparent to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/60 shadow-lg">
              <Bot className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 md:h-3 md:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 md:h-3 md:w-3 bg-green-500" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-xl font-semibold flex items-center gap-2 flex-wrap">
              <span className="truncate">HG Core</span>
              <Badge variant="secondary" className="font-normal text-xs hidden sm:flex">
                <Zap className="mr-1 h-3 w-3" />
                Instant
              </Badge>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">Your internship guide</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={clearChat} disabled={isTyping} className="h-8 md:h-9 bg-transparent">
              <RefreshCw className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">New Chat</span>
            </Button>
            {/* Mobile Knowledge Base Sheet */}
            <Sheet open={showKnowledgeBase} onOpenChange={setShowKnowledgeBase}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 md:h-9 md:hidden bg-transparent">
                  <BookOpen className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-80 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Knowledge Base</SheetTitle>
                </SheetHeader>
                <KnowledgeBaseContent />
              </SheetContent>
            </Sheet>
            {/* Desktop Knowledge Base Toggle */}
            <Button
              variant={showKnowledgeBase ? "default" : "outline"}
              size="sm"
              onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
              className="h-8 md:h-9 hidden md:flex"
            >
              <BookOpen className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Knowledge Base</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col overflow-hidden ${showKnowledgeBase ? "md:border-r" : ""}`}>
          {/* Messages */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 p-3 md:p-6 pb-10">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 md:gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-7 w-7 md:h-8 md:w-8 mt-1 shrink-0 bg-linear-to-br from-primary to-primary/60">
                      <AvatarFallback className="bg-transparent text-primary-foreground">
                        <Bot className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-2xl px-3 py-2 md:px-4 md:py-3 max-w-[85%] shadow-sm ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                  >
                    {renderMessageContent(message.content, message.isStreaming)}
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-7 w-7 md:h-8 md:w-8 mt-1 shrink-0">
                      <AvatarFallback className="bg-secondary">
                        <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} className="h-4 w-full" />
            </div>
          </ScrollArea>

          {/* Quick Topics - Mobile optimized */}
          {messages.length <= 1 && (
            <div className="border-t px-3 py-3 md:px-6 md:py-4 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2 md:mb-3">Quick topics:</p>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {QUICK_TOPICS.map((topic) => (
                  <Button
                    key={topic.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickTopic(topic.query)}
                    disabled={isTyping}
                    className={`text-xs h-7 md:h-8 px-2 md:px-3 ${topic.color}`}
                  >
                    <topic.icon className="mr-1 md:mr-2 h-3 w-3" />
                    {topic.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Live Suggestions - Mobile optimized */}
          {suggestions.length > 0 && !isTyping && (
            <div className="border-t px-3 py-2 md:px-6 md:py-3 bg-muted/20">
              <p className="text-xs text-muted-foreground mb-1.5 md:mb-2">Suggestions:</p>
              <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {suggestions.map((entry) => (
                  <Button
                    key={entry.id}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 bg-background hover:bg-muted whitespace-nowrap shrink-0"
                    onClick={() => setInput(entry.question || entry.title)}
                  >
                    <Sparkles className="mr-1 h-3 w-3 text-primary" />
                    {entry.title}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area - Mobile optimized */}
          <div className="border-t p-3 md:p-4 bg-background">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 h-10 md:h-11"
                  disabled={isTyping}
                />
                <Button type="submit" size="icon" className="h-10 w-10 md:h-11 md:w-11" disabled={!input.trim() || isTyping}>
                  {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center hidden md:block">
                Press Enter to send - No external API needed
              </p>
            </form>
          </div>
        </div>

        {/* Desktop Knowledge Base Sidebar */}
        {showKnowledgeBase && (
          <div className="hidden md:flex w-80 flex-col overflow-hidden bg-muted/30">
            <KnowledgeBaseContent />
          </div>
        )}
      </div>
    </div>
  );
}
