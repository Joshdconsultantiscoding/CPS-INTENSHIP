import { ComingSoon } from "@/components/portals/coming-soon";
import { Briefcase } from "lucide-react";

export default function RecruiterPortalPage() {
    return (
        <ComingSoon
            portalName="Recruiter Portal"
            description="Discover top-performing interns, streamline your hiring pipeline, and connect with emerging talent before anyone else. Powered by real performance data."
            icon={<Briefcase className="w-10 h-10 text-white" />}
            gradientFrom="from-blue-600"
            gradientTo="to-cyan-600"
        />
    );
}
