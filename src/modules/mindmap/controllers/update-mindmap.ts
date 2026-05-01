import type { NextFunction, Request, Response } from 'express';
import type { DatabaseClient } from '@/shared/helpers/database.helper.js';
import { STATUS_CODES } from '@/shared/constants/status-codes.js';
import z from 'zod';

export const ValidationSchema = {
    params: z.object({
        mindmap_id: z.uuid(),
    }),
    body: z.object({
        title: z.string().trim().min(1).max(255).optional(),
        nodes: z.array(z.unknown()).optional(),
        edges: z.array(z.unknown()).optional(),
        viewport: z.record(z.string(), z.unknown()).optional(),
    }),
};

export async function Controller(
    req: Request,
    res: Response,
    next: NextFunction,
    db: DatabaseClient,
) {
    const { mindmap_id: mindmapId } = req.params as z.infer<typeof ValidationSchema.params>;
    const { title, nodes, edges, viewport } = req.body as z.infer<typeof ValidationSchema.body>;
    const userId = (req as Request & { user: { id: string } }).user.id;

    const existing = await db.queryOne<{ id: string; title: string; nodes: unknown[]; edges: unknown[]; viewport: Record<string, unknown> }>(
        'SELECT id, title, nodes, edges, viewport FROM mindmaps WHERE id = $1 AND user_id = $2',
        [mindmapId, userId],
    );

    if (!existing) return res.status(STATUS_CODES.NOT_FOUND).json({ message: 'Mind map not found' });

    const updated = await db.queryOne<{
        id: string;
        user_id: string;
        title: string;
        nodes: unknown[];
        edges: unknown[];
        viewport: Record<string, unknown>;
        created_at: string;
        updated_at: string | null;
    }>(
        `UPDATE mindmaps
         SET title = $3,
             nodes = $4::jsonb,
             edges = $5::jsonb,
             viewport = $6::jsonb,
             updated_at = now()
         WHERE id = $1 AND user_id = $2
         RETURNING id, user_id, title, nodes, edges, viewport, created_at, updated_at`,
        [
            mindmapId,
            userId,
            title ?? existing.title,
            JSON.stringify(nodes ?? existing.nodes),
            JSON.stringify(edges ?? existing.edges),
            JSON.stringify(viewport ?? existing.viewport),
        ],
    );

    return res.status(STATUS_CODES.OK).json({ data: updated });
}
