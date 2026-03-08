import { ChannelWithSchedules } from '@/types/channel';

// 5 minutes in milliseconds
const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry {
    timestamp: number;
    data: ChannelWithSchedules[];
}

export const ScheduleCacheService = {
    getCacheKey(day: string): string {
        return `schedule-cache-${day}`;
    },

    get(day: string): { data: ChannelWithSchedules[] | null; isStale: boolean } {
        if (typeof window === 'undefined') return { data: null, isStale: true };

        const key = this.getCacheKey(day);
        const item = localStorage.getItem(key);

        if (!item) return { data: null, isStale: true };

        try {
            const parsed: CacheEntry = JSON.parse(item);
            const isStale = Date.now() - parsed.timestamp > CACHE_TTL;
            return { data: parsed.data, isStale };
        } catch {
            return { data: null, isStale: true };
        }
    },

    set(day: string, data: ChannelWithSchedules[]): void {
        if (typeof window === 'undefined') return;

        const key = this.getCacheKey(day);
        const entry: CacheEntry = {
            timestamp: Date.now(),
            data,
        };

        try {
            localStorage.setItem(key, JSON.stringify(entry));
        } catch (e) {
            console.warn('Failed to save schedule to localStorage', e);
        }
    },

    // Useful for when SSE live status updates occur - we want the next tab switch to show fresh data
    invalidate(day: string): void {
        if (typeof window === 'undefined') return;
        const key = this.getCacheKey(day);
        localStorage.removeItem(key);
    }
};
