/**
 * middleware/auth.ts
 * JWT 认证中间件
 */
import { Request, Response, NextFunction } from 'express';
import jw from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-me';

// 扩展 Express Request 类型，附加 userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export interface AuthRequest extends Request {
  userId: string;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7); // 去掉 "Bearer "

  try {
    const payload = jw.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.userId = payload.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * 生成 JWT Token
 */
export function generateToken(userId: string, email: string): string {
  return jw.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}
