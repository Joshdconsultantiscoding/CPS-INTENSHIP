import { NextResponse } from "next/server";
import { GeoService } from "@/lib/services/geo-service";

/**
 * GET /api/geo
 * Detects user's region from IP headers and returns region + pricing info.
 */
export async function GET() {
    try {
        const region = await GeoService.detectRegion();
        const allRegions = await GeoService.getAllRegions();
        const pricing = await GeoService.getRegionPricing(region.regionCode);

        return NextResponse.json({
            region,
            allRegions,
            pricing,
        });
    } catch (error) {
        console.error("[/api/geo] Error:", error);
        return NextResponse.json(
            {
                region: GeoService.getDefaultRegion(),
                allRegions: [GeoService.getDefaultRegion()],
                pricing: [],
            },
            { status: 200 }
        );
    }
}
