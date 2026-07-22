import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ROLES } from '@half-dinar/shared';
import { env } from '../../config/env.js';
import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/** Pass errors to Express via next() — throwing crashes the process in middleware. */
export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AppError(401, ErrorCodes.UNAUTHORIZED, 'Authentication required'));
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid or expired access token'));
  }
}

export function optionalAuthenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}

export function requirePermission(...permissions: string[]) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        next(new AppError(401, ErrorCodes.UNAUTHORIZED, 'Authentication required'));
        return;
      }

      if (req.user.roles.includes(ROLES.SUPER_ADMIN)) {
        next();
        return;
      }

      const userRoles = await prisma.userRole.findMany({
        where: { userId: req.user.sub },
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      });

      const userPermissions = new Set<string>();
      for (const ur of userRoles) {
        ur.role.permissions.forEach((rp: { permission: { slug: string } }) =>
          userPermissions.add(rp.permission.slug),
        );
      }

      const hasPermission = permissions.some((p) => userPermissions.has(p));
      if (!hasPermission) {
        next(new AppError(403, ErrorCodes.FORBIDDEN, 'Insufficient permissions'));
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireSuperAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user?.roles.includes(ROLES.SUPER_ADMIN)) {
    next(new AppError(403, ErrorCodes.FORBIDDEN, 'Super Admin access required'));
    return;
  }
  next();
}

export function requireStaff(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const roles = req.user?.roles ?? [];
  const isStaff = roles.some((r) => r !== ROLES.CUSTOMER);
  if (!isStaff) {
    next(new AppError(403, ErrorCodes.FORBIDDEN, 'Staff access required'));
    return;
  }
  next();
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
