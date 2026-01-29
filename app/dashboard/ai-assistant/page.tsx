import { Metadata } from "next";
import { AiAssistantChat } from "@/components/ai-assistant/ai-assistant-chat";

export const metadata: Metadata = {
  title: "AI Assistant",
};

export default function AiAssistantPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
          <p className="text-muted-foreground">
            Get help with tasks, reports, and performance insights
          </p>
        </div>
      </div>
      <AiAssistantChat />
    </div>
  );
}
