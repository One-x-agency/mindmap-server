import type { NextFunction, Request, Response } from 'express';
import type { DatabaseClient } from '@/shared/helpers/database.helper.js';
import { STATUS_CODES } from '@/shared/constants/status-codes.js';
import { TOKEN_TYPES } from '@/modules/auth/auth.constant.js';
import { createJWTToken } from '@/shared/utilities/token.js';
import env from '@/shared/configs/env.js';
import z from 'zod';

export const ValidationSchema = {
    body: z.object({
        id_token: z.string().trim().min(10),
    }),
};

type GoogleTokenInfoResponse = {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
    email_verified?: 'true' | 'false';
    aud?: string;
};

async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfoResponse | null> {
    const url = new URL('https://oauth2.googleapis.com/tokeninfo');
    url.searchParams.set('id_token', idToken);

    try {
        const response = await fetch(url.toString());
        if (!response.ok) return null;

        const data = (await response.json()) as GoogleTokenInfoResponse;

        if (data.aud !== env.GOOGLE_CLIENT_ID) return null;
        if (data.email_verified !== 'true') return null;
        if (!data.email || !data.sub) return null;

        return data;
    } catch {
        return null;
    }
}

type UsersGoogleColumns = {
    has_google_sub: boolean;
    has_auth_provider: boolean;
};

async function getUsersGoogleColumns(db: DatabaseClient): Promise<UsersGoogleColumns> {
    const columns = await db.queryAll<{ column_name: string }>(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'users'
           AND column_name IN ('google_sub', 'auth_provider')`,
    );

    const columnNames = new Set(columns.map((column) => column.column_name));

    return {
        has_google_sub: columnNames.has('google_sub'),
        has_auth_provider: columnNames.has('auth_provider'),
    };
}

export async function Controller(
    req: Request,
    res: Response,
    next: NextFunction,
    db: DatabaseClient,
) {
    const { id_token: idToken } = req.body as z.infer<typeof ValidationSchema.body>;
    const usersGoogleColumns = await getUsersGoogleColumns(db);

    const googleProfile = await verifyGoogleIdToken(idToken);
    if (!googleProfile) {
        return res
            .status(STATUS_CODES.UNAUTHORIZED)
            .json({ message: 'Invalid Google token or client id mismatch' });
    }

    const existingUser = await db.queryOne<{
        id: string;
        name: string;
        email: string;
        google_sub: string | null;
    }>(
        usersGoogleColumns.has_google_sub
            ? 'SELECT id, name, email, google_sub FROM users WHERE email = $1'
            : 'SELECT id, name, email, NULL::text AS google_sub FROM users WHERE email = $1',
        [googleProfile.email],
    );

    let user = existingUser;

    if (!user) {
        if (usersGoogleColumns.has_google_sub && usersGoogleColumns.has_auth_provider) {
            user = await db.queryOne<{
                id: string;
                name: string;
                email: string;
                google_sub: string | null;
            }>(
                `INSERT INTO users (name, email, password_hash, google_sub, auth_provider)
                 VALUES ($1, $2, '', $3, 'google')
                 RETURNING id, name, email, google_sub`,
                [googleProfile.name || 'Google User', googleProfile.email, googleProfile.sub],
            );
        } else {
            user = await db.queryOne<{
                id: string;
                name: string;
                email: string;
                google_sub: string | null;
            }>(
                `INSERT INTO users (name, email, password_hash)
                 VALUES ($1, $2, '')
                 RETURNING id, name, email, NULL::text AS google_sub`,
                [googleProfile.name || 'Google User', googleProfile.email],
            );
        }
    } else if (!user.google_sub && usersGoogleColumns.has_google_sub && usersGoogleColumns.has_auth_provider) {
        user = await db.queryOne<{
            id: string;
            name: string;
            email: string;
            google_sub: string | null;
        }>(
            `UPDATE users
             SET google_sub = $2, auth_provider = 'google', updated_at = now()
             WHERE id = $1
             RETURNING id, name, email, google_sub`,
            [user.id, googleProfile.sub],
        );
    }

    if (!user) {
        return res
            .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
            .json({ message: 'Unable to complete Google login' });
    }

    const accessToken = await createJWTToken({ type: TOKEN_TYPES.USER_ACCESS_TOKEN, user_id: user.id }, '24h');

    return res.status(STATUS_CODES.OK).json({
        token: accessToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: googleProfile.picture || null,
        },
    });
}
