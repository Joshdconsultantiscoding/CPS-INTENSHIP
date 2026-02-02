"use client";

let timeOffset = 0;
let lastSync = 0;

/**
 * Fetches the current time from multiple high-availability APIs to ensure sync.
 */
export async function syncServerTime() {
    const apis = [
        "https://worldtimeapi.org/api/timezone/Africa/Lagos",
        "https://timeapi.io/api/Time/current/zone?timeZone=Africa/Lagos"
    ];

    console.log("[TimeSync] Starting sync attempt...");

    for (const url of apis) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const response = await fetch(url, {
                cache: 'no-store',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                // Handle different response formats
                const serverTimeStr = data.datetime || data.dateTime;
                if (!serverTimeStr) continue;

                const serverTime = new Date(serverTimeStr).getTime();
                const localTime = Date.now();
                timeOffset = serverTime - localTime;
                lastSync = Date.now();

                console.log(`[TimeSync] Success via ${url}. Offset: ${timeOffset}ms. Server: ${serverTimeStr}`);
                return; // Sync complete
            }
        } catch (e) {
            console.warn(`[TimeSync] Failed to sync with ${url}:`, e);
        }
    }

    console.warn("[TimeSync] All APIs failed or timed out. Falling back to system clock.");
}

/**
 * Returns the current synchronized time as a Date object.
 */
export function getSyncedTime(): Date {
    // Re-sync every 30 minutes if needed (background)
    if (Date.now() - lastSync > 30 * 60 * 1000) {
        syncServerTime();
    }
    return new Date(Date.now() + timeOffset);
}

/**
 * Returns the current synchronized time ISO string.
 */
export function getSyncedISOString(): string {
    return getSyncedTime().toISOString();
}
