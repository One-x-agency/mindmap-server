import type { NextFunction, Request, Response } from 'express';
import type { DatabaseClient } from '@/shared/helpers/database.helper.js';
import { STATUS_CODES } from '@/shared/constants/status-codes.js';
import z from 'zod';

export const ValidationSchema = {
    body: z.object({
        title: z.string().trim().min(1).max(255).default('Untitled mind map'),
        nodes: z.array(z.unknown()).default([]),
        edges: z.array(z.unknown()).default([]),
        viewport: z.record(z.string(), z.unknown()).default({}),
    }),
};

export async function Controller(
    req: Request,
    res: Response,
    next: NextFunction,
    db: DatabaseClient,
) {
    const { title, nodes, edges, viewport } = req.body as z.infer<typeof ValidationSchema.body>;
    const userId = (req as Request & { user: { id: string } }).user.id;

    const mindmap = await db.queryOne<{
        id: string;
        user_id: string;
        title: string;
        nodes: unknown[];
        edges: unknown[];
        viewport: Record<string, unknown>;
        created_at: string;
        updated_at: string | null;
    }>(
        `INSERT INTO mindmaps (user_id, title, nodes, edges, viewport)
         VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb)
         RETURNING id, user_id, title, nodes, edges, viewport, created_at, updated_at`,
        [userId, title, JSON.stringify(nodes), JSON.stringify(edges), JSON.stringify(viewport)],
    );

    return res.status(STATUS_CODES.CREATED).json({ data: mindmap });
}
