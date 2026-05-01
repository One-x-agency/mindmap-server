// src/types/express.d.ts';

declare global {
    namespace Express {
        interface Request {
            validatedQuery?: unknown;
            id?: string;
            user?: { id: string };
        }
    }
}

export {};
