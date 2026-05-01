import type { NextFunction, Request, Response } from 'express';
import type { DatabaseClient } from '@/shared/helpers/database.helper.js';
import { STATUS_CODES } from '@/shared/constants/status-codes.js';
import z from 'zod';

export const ValidationSchema = {
    query: z.object({
        offset: z.coerce.number().int().min(0).default(0),
        limit: z.coerce.number().int().min(1).max(100).default(30),
        search: z.string().trim().optional(),
    }),
};

export async function Controller(
    req: Request,
    res: Response,
    next: NextFunction,
    db: DatabaseClient,
) {
    const { offset, limit, search } = (req as Request & { validatedQuery: z.infer<typeof ValidationSchema.query> }).validatedQuery;
    const userId = (req as Request & { user: { id: string } }).user.id;

    const searchText = search?.trim();
    const whereSql = searchText ? 'AND title ILIKE $4' : '';
    const params = searchText
        ? [userId, limit, offset, `%${searchText}%`]
        : [userId, limit, offset];

    const data = await db.queryAll<{
        id: string;
        title: string;
        created_at: string;
        updated_at: string | null;
    }>(
        `SELECT id, title, created_at, updated_at
         FROM mindmaps
         WHERE user_id = $1 ${whereSql}
         ORDER BY COALESCE(updated_at, created_at) DESC
         LIMIT $2 OFFSET $3`,
        params,
    );

    const totalRow = await db.queryOne<{ total: string }>(
        `SELECT COUNT(*)::text AS total
         FROM mindmaps
         WHERE user_id = $1 ${searchText ? 'AND title ILIKE $2' : ''}`,
        searchText ? [userId, `%${searchText}%`] : [userId],
    );

    return res.status(STATUS_CODES.OK).json({
        data,
        meta: {
            offset,
            limit,
            total: Number(totalRow?.total || 0),
        },
    });
}
