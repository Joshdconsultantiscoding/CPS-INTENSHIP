"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Brain,
    Settings,
    Upload,
    MessageSquare,
    ScrollText,
    BookOpen,
    UserCog,
    Shield,
} from "lucide-react";
import AISettingsPanel from "./ai-settings-panel";
import GlobalKnowledgeUpload from "./global-knowledge-upload";
import InternDocumentUpload from "./intern-document-upload";
import AIChatPanel from "./ai-chat-panel";
import AILogsViewer from "./ai-logs-viewer";
import ClonePersonalityEditor from "./clone-personality-editor";
import CourseGeneratorUI from "./course-generator-ui";

export default function AIControlCenter() {
    const [activeTab, setActiveTab] = useState("settings");

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg">
                    <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">AI Intelligence Engine</h1>
                    <p className="text-sm text-muted-foreground">
                        Knowledge-aware AI powered by document authority hierarchy
                    </p>
                </div>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                    <TabsTrigger value="settings" className="gap-1.5 text-xs sm:text-sm">
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Settings</span>
                    </TabsTrigger>
                    <TabsTrigger value="global-knowledge" className="gap-1.5 text-xs sm:text-sm">
                        <Shield className="h-4 w-4" />
                        <span className="hidden sm:inline">Global Knowledge</span>
                    </TabsTrigger>
                    <TabsTrigger value="intern-docs" className="gap-1.5 text-xs sm:text-sm">
                        <Upload className="h-4 w-4" />
                        <span className="hidden sm:inline">Intern Docs</span>
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="gap-1.5 text-xs sm:text-sm">
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">AI Chat</span>
                    </TabsTrigger>
                    <TabsTrigger value="course-gen" className="gap-1.5 text-xs sm:text-sm">
                        <BookOpen className="h-4 w-4" />
                        <span className="hidden sm:inline">Course Gen</span>
                    </TabsTrigger>
                    <TabsTrigger value="personality" className="gap-1.5 text-xs sm:text-sm">
                        <UserCog className="h-4 w-4" />
                        <span className="hidden sm:inline">Clone</span>
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="gap-1.5 text-xs sm:text-sm">
                        <ScrollText className="h-4 w-4" />
                        <span className="hidden sm:inline">Logs</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="mt-4">
                    <AISettingsPanel />
                </TabsContent>

                <TabsContent value="global-knowledge" className="mt-4">
                    <GlobalKnowledgeUpload />
                </TabsContent>

                <TabsContent value="intern-docs" className="mt-4">
                    <InternDocumentUpload />
                </TabsContent>

                <TabsContent value="chat" className="mt-4">
                    <AIChatPanel />
                </TabsContent>

                <TabsContent value="course-gen" className="mt-4">
                    <CourseGeneratorUI />
                </TabsContent>

                <TabsContent value="personality" className="mt-4">
                    <ClonePersonalityEditor />
                </TabsContent>

                <TabsContent value="logs" className="mt-4">
                    <AILogsViewer />
                </TabsContent>
            </Tabs>
        </div>
    );
}
