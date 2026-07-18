import type { NextFunction, Request, Response } from 'express';
import { cartService } from '../../application/services/cart.service.js';

export interface CartRequest extends Request {
  cartToken?: string;
  isNewCartToken?: boolean;
}

const CART_COOKIE = 'cart_token';

export function resolveCartContext(req: CartRequest, res: Response, next: NextFunction): void {
  const headerToken = req.headers['x-cart-token'];
  const cookieHeader = req.headers.cookie ?? '';
  const cookieMatch = cookieHeader.match(new RegExp(`${CART_COOKIE}=([^;]+)`));
  const cookieToken = cookieMatch?.[1];

  let token = typeof headerToken === 'string' ? headerToken : cookieToken;

  if (!token) {
    token = cartService.createGuestToken();
    req.isNewCartToken = true;
  }

  req.cartToken = token;

  if (req.isNewCartToken) {
    res.cookie(CART_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
    });
  }

  next();
}

export function attachCartTokenHeader(req: CartRequest, res: Response, next: NextFunction): void {
  if (req.cartToken) {
    res.setHeader('X-Cart-Token', req.cartToken);
  }
  next();
}
