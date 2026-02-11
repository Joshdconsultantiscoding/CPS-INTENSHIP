/*
  Messages Local Storage Service
  Uses IndexedDB (via idb-keyval) to store chat history locally.
  Optimized for "Instant Load" and "Background Sync".
  
  Schema:
  - Key: `chat_v2:${currentUserId}:${chatId}` -> Array of Messages
  - Key: `chat_meta_v2:${currentUserId}:${chatId}` -> { lastSync: number, cursor: string }
*/

import { get, set, update } from 'idb-keyval';
import { Message } from '@/lib/types';

const CACHE_PREFIX = 'chat_v2';
const META_PREFIX = 'chat_meta_v2';

export const MessagesStore = {

    // 1. Get Cached Messages (Instant)
    async getMessages(currentUserId: string, chatId: string): Promise<Message[]> {
        const key = `${CACHE_PREFIX}:${currentUserId}:${chatId}`;
        try {
            const messages = await get<Message[]>(key);
            return messages || [];
        } catch (error) {
            console.error('[MessagesStore] User read failed', error);
            return [];
        }
    },

    // 2. Save Messages (Append/Update)
    async saveMessages(currentUserId: string, chatId: string, newMessages: Message[]): Promise<void> {
        const key = `${CACHE_PREFIX}:${currentUserId}:${chatId}`;
        try {
            await update(key, (oldVal: Message[] | undefined) => {
                const current = oldVal || [];
                // Map by ID to prevent duplicates & handle updates
                const messageMap = new Map(current.map(m => [m.id, m]));

                newMessages.forEach(m => {
                    messageMap.set(m.id, m);
                });

                // Convert back to array and sort by created_at (ascending)
                return Array.from(messageMap.values()).sort((a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
            });
        } catch (error) {
            console.error('[MessagesStore] Save failed', error);
        }
    },

    // 3. Clear Cache (for logout or debugging)
    async clearCache(currentUserId: string, chatId: string) {
        const key = `${CACHE_PREFIX}:${currentUserId}:${chatId}`;
        await set(key, []);
    }
};
