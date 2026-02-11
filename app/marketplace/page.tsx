import { ComingSoon } from "@/components/portals/coming-soon";
import { Globe } from "lucide-react";

export default function MarketplacePage() {
    return (
        <ComingSoon
            portalName="Intern Marketplace"
            description="Browse and discover internship opportunities from verified companies. Build your public profile, showcase your skills, and get matched with the perfect role."
            icon={<Globe className="w-10 h-10 text-white" />}
            gradientFrom="from-rose-600"
            gradientTo="to-pink-600"
        />
    );
}
