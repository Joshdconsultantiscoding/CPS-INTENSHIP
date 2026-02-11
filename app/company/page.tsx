import { ComingSoon } from "@/components/portals/coming-soon";
import { Building2 } from "lucide-react";

export default function CompanyPortalPage() {
    return (
        <ComingSoon
            portalName="Company Portal"
            description="Manage your internship programs at scale. Post opportunities, track intern progress across teams, and build your employer brand — all in one platform."
            icon={<Building2 className="w-10 h-10 text-white" />}
            gradientFrom="from-orange-600"
            gradientTo="to-amber-600"
        />
    );
}
