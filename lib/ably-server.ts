import * as Ably from "ably";

let ablyAdmin: Ably.Rest | null = null;

export const getAblyAdmin = () => {
    if (!ablyAdmin && process.env.ABLY_API_KEY) {
        ablyAdmin = new Ably.Rest({ key: process.env.ABLY_API_KEY });
    }
    return ablyAdmin;
};

export async function publishGlobalUpdate(eventName: string, data: any) {
    const ably = getAblyAdmin();
    if (!ably) return;

    try {
        const channel = ably.channels.get("global-updates");
        await channel.publish(eventName, data);
        console.log(`[AblyServer] Published ${eventName} to global-updates`);
    } catch (error) {
        console.error(`[AblyServer] Failed to publish ${eventName}:`, error);
    }
}
