import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth-service';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Dev: allow bypassing auth entirely when SKIP_AUTH='true' (local testing only)
  if (process.env.SKIP_AUTH === 'true') {
    req.user = {
      userId: 1,
      username: 'dev-admin',
      email: 'dev@local',
      role: 'admin',
    };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = AuthService.verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = {
    userId: decoded.userId,
    username: decoded.username,
    email: decoded.email,
    role: decoded.role,
  };

  next();
};

/**
 * Middleware to check if user has required role(s)
 */
export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!AuthService.hasRole(req.user.role, requiredRoles)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware to check if user is admin or manager
 */
export const requireManager = requireRole(['admin', 'manager']);

/**
 * Optional authentication - adds user to request if token is valid but doesn't fail if missing
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = AuthService.verifyToken(token);
    if (decoded) {
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
      };
    }
  }

  next();
};
