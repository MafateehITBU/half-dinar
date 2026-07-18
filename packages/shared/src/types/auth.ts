export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  locale: 'ar' | 'en';
  roles: string[];
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}
