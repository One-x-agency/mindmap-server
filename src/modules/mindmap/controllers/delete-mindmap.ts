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

    const deleted = await db.queryOne<{ id: string }>(
        'DELETE FROM mindmaps WHERE id = $1 AND user_id = $2 RETURNING id',
        [mindmapId, userId],
    );

    if (!deleted) return res.status(STATUS_CODES.NOT_FOUND).json({ message: 'Mind map not found' });

    return res.status(STATUS_CODES.NO_CONTENT).send();
}
