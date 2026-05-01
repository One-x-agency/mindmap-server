import type { NextFunction, Request, Response } from 'express';
import { STATUS_CODES } from '@/shared/constants/status-codes.js';
import { TOKEN_TYPES } from '@/modules/auth/auth.constant.js';
import { decodeJWTToken } from '@/shared/utilities/token.js';

type AccessTokenPayload = {
    type: TOKEN_TYPES;
    user_id: string;
    exp?: number;
    iat?: number;
};

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res
            .status(STATUS_CODES.UNAUTHORIZED)
            .json({ message: 'Authorization token is required' });
    }

    const token = authHeader.slice(7);
    const payload = await decodeJWTToken<AccessTokenPayload>(token);

    if (!payload || payload.type !== TOKEN_TYPES.USER_ACCESS_TOKEN || !payload.user_id) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({ message: 'Invalid or expired token' });
    }

    (req as Request & { user: { id: string } }).user = { id: payload.user_id };
    return next();
}
