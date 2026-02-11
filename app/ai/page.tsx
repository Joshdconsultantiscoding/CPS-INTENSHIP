import { ComingSoon } from "@/components/portals/coming-soon";
import { Sparkles } from "lucide-react";

export default function AIPortalPage() {
    return (
        <ComingSoon
            portalName="AI Portal"
            description="Harness artificial intelligence to automate intern evaluations, generate smart task assignments, and get predictive analytics on intern performance."
            icon={<Sparkles className="w-10 h-10 text-white" />}
            gradientFrom="from-violet-600"
            gradientTo="to-fuchsia-600"
        />
    );
}
