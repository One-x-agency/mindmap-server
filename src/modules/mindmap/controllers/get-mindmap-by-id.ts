import type { NextFunction, Request, Response } from 'express';
import type { DatabaseClient } from '@/shared/helpers/database.helper.js';
import { STATUS_CODES } from '@/shared/constants/status-codes.js';
import z from 'zod';

export const ValidationSchema = {
    params: z.object({
        mindmap_id: z.uuid(),
    }),
};

export async function Controller(
    req: Request,
    res: Response,
    next: NextFunction,
    db: DatabaseClient,
) {
    const { mindmap_id: mindmapId } = req.params as z.infer<typeof ValidationSchema.params>;
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
        `SELECT id, user_id, title, nodes, edges, viewport, created_at, updated_at
         FROM mindmaps
         WHERE id = $1 AND user_id = $2`,
        [mindmapId, userId],
    );

    if (!mindmap) return res.status(STATUS_CODES.NOT_FOUND).json({ message: 'Mind map not found' });

    return res.status(STATUS_CODES.OK).json({ data: mindmap });
}
