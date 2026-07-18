export interface AdminUserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  locale: 'ar' | 'en';
  isActive: boolean;
  emailVerified: boolean;
  roles: string[];
  orderCount: number;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
