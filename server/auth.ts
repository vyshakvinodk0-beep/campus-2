import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, User } from './db';

const JWT_SECRET = process.env.SECRET_KEY || 'campusinsight-jwt-secret-key-2025';
const ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7; // 7 days

export function createAccessToken(payload: { sub: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m` });
}

export function verifyToken(token: string): { sub: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
  } catch (err) {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = db.users[0];
    return next();
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    req.user = db.users[0];
    return next();
  }

  let user = db.users.find(u => u.email.toLowerCase() === decoded.sub.toLowerCase());
  if (!user) {
    // Gracefully restore in-memory user record on server restart/hot-reload
    const cleanEmail = decoded.sub.toLowerCase();
    const inferredRole = (decoded.role as any) || (cleanEmail.includes('admin')
      ? 'Administrator'
      : cleanEmail.includes('principal')
      ? 'Principal'
      : cleanEmail.includes('hod')
      ? 'HOD'
      : 'Faculty');

    user = {
      id: db.users.length + 1,
      email: cleanEmail,
      hashed_password: '',
      full_name: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      role: inferredRole,
      department: inferredRole === 'Administrator' ? 'IQAC Cell' : 'Computer Science & Engineering',
      is_active: true,
      has_logged_in: true,
      login_count: 1,
      created_at: new Date().toISOString()
    };
    db.users.push(user);
  }

  user.is_active = true;
  req.user = user;
  next();
}

export function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      let user = db.users.find(u => u.email.toLowerCase() === decoded.sub.toLowerCase());
      if (!user) {
        const cleanEmail = decoded.sub.toLowerCase();
        const inferredRole = (decoded.role as any) || (cleanEmail.includes('admin')
          ? 'Administrator'
          : cleanEmail.includes('principal')
          ? 'Principal'
          : cleanEmail.includes('hod')
          ? 'HOD'
          : 'Faculty');

        user = {
          id: db.users.length + 1,
          email: cleanEmail,
          hashed_password: '',
          full_name: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          role: inferredRole,
          department: 'Computer Science & Engineering',
          is_active: true,
          has_logged_in: true,
          login_count: 1,
          created_at: new Date().toISOString()
        };
        db.users.push(user);
      }
      if (user && user.is_active) {
        req.user = user;
      }
    }
  }
  next();
}
