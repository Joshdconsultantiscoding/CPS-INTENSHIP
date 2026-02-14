import { getAuthUser } from "@/lib/auth";
import AssistantContent from "./assistant-content";

export const metadata = {
  title: "HG Core Assistant",
};

export default async function AssistantPage() {
  const user = await getAuthUser();

  // Enforce access control
  const { enforceAccess } = await import("@/lib/middleware/access-guard");
  const access = await enforceAccess(user.id, "/dashboard/assistant");

  if (!access.allowed) {
    const { BlockedRouteView } = await import("@/components/dashboard/blocked-route-view");
    return (
      <BlockedRouteView
        reason={access.reason || "Access to the HG Core Assistant has been restricted by an administrator."}
        route="/dashboard/assistant"
        routeName="Assistant"
      />
    );
  }

  return <AssistantContent />;
}
