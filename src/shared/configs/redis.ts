type SetOptions = {
    EX?: number;
};

type CacheEntry = {
    value: string;
    expiresAt: number | null;
};

const cache = new Map<string, CacheEntry>();

function cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
        if (entry.expiresAt !== null && entry.expiresAt <= now) cache.delete(key);
    }
}

const redisClient = {
    async connect() {
        return true;
    },
    async set(key: string, value: string | number, options?: SetOptions) {
        cleanupExpired();
        const ttlMs = options?.EX ? options.EX * 1000 : null;
        cache.set(key, {
            value: String(value),
            expiresAt: ttlMs ? Date.now() + ttlMs : null,
        });
        return 'OK';
    },
    async get(key: string) {
        cleanupExpired();
        const entry = cache.get(key);
        if (!entry) return null;
        return entry.value;
    },
};

export default redisClient;
