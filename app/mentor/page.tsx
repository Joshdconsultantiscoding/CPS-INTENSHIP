import { ComingSoon } from "@/components/portals/coming-soon";
import { Users } from "lucide-react";

export default function MentorPortalPage() {
    return (
        <ComingSoon
            portalName="Mentor Portal"
            description="Guide and mentor the next generation of interns. Track progress, provide feedback, and build meaningful professional relationships — all from one powerful dashboard."
            icon={<Users className="w-10 h-10 text-white" />}
            gradientFrom="from-emerald-600"
            gradientTo="to-teal-600"
        />
    );
}
