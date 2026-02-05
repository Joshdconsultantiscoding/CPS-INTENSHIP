"use client";

let timeOffset = 0;
let lastSync = 0;

/**
 * Fetches the current time from multiple high-availability APIs.
 * Optimism: Returns quickly if already synced or locally reliable.
 */
export async function syncServerTime() {
    // Only sync once every 30 minutes to reduce network overhead
    if (lastSync > 0 && Date.now() - lastSync < 30 * 60 * 1000) {
        return;
    }

    const apis = [
        "https://timeapi.io/api/Time/current/zone?timeZone=Africa/Lagos",
        "https://worldtimeapi.org/api/timezone/Africa/Lagos"
    ];

    // Attempt sync in background
    (async () => {
        for (const url of apis) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000); // Shorter timeout

                const response = await fetch(url, {
                    next: { revalidate: 3600 }, // Cache if supported by environment
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    const serverTimeStr = data.datetime || data.dateTime;
                    if (!serverTimeStr) continue;

                    const serverTime = new Date(serverTimeStr).getTime();
                    timeOffset = serverTime - Date.now();
                    lastSync = Date.now();
                    return;
                }
            } catch (e) {
                // Silently fail, stick to system clock
            }
        }
    })();
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
