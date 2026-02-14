import { Metadata } from "next";
import { AiAssistantChat } from "@/components/ai-assistant/ai-assistant-chat";

export const metadata: Metadata = {
  title: "AI Assistant",
};

export default async function AiAssistantPage() {
  const { getAuthUser } = await import("@/lib/auth");
  const user = await getAuthUser();

  // Enforce access control
  const { enforceAccess } = await import("@/lib/middleware/access-guard");
  const access = await enforceAccess(user.id, "/dashboard/ai-assistant");

  if (!access.allowed) {
    const { BlockedRouteView } = await import("@/components/dashboard/blocked-route-view");
    return (
      <BlockedRouteView
        reason={access.reason || "Access to the AI Assistant has been restricted by an administrator."}
        route="/dashboard/ai-assistant"
        routeName="AI Assistant"
      />
    );
  }

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
