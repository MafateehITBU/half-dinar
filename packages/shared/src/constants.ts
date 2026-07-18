export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGE_PRODUCT: 'manage_product',
  SALES: 'sales',
  INSIGHTS: 'insights',
  CUSTOMER: 'customer',
} as const;

export type RoleSlug = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  CATEGORIES_READ: 'categories:read',
  CATEGORIES_WRITE: 'categories:write',
  PACKAGES_READ: 'packages:read',
  PACKAGES_WRITE: 'packages:write',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
  ORDERS_READ: 'orders:read',
  ORDERS_WRITE: 'orders:write',
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_WRITE: 'customers:write',
  PROMOTIONS_READ: 'promotions:read',
  PROMOTIONS_WRITE: 'promotions:write',
  CMS_READ: 'cms:read',
  CMS_WRITE: 'cms:write',
  ANALYTICS_READ: 'analytics:read',
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
  AUDIT_READ: 'audit:read',
  REFUNDS_READ: 'refunds:read',
  REFUNDS_WRITE: 'refunds:write',
} as const;

export type PermissionSlug = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<RoleSlug, PermissionSlug[]> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_WRITE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.CATEGORIES_WRITE,
    PERMISSIONS.PACKAGES_READ,
    PERMISSIONS.PACKAGES_WRITE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_WRITE,
    PERMISSIONS.PROMOTIONS_READ,
    PERMISSIONS.PROMOTIONS_WRITE,
    PERMISSIONS.CMS_READ,
    PERMISSIONS.CMS_WRITE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_WRITE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.REFUNDS_READ,
    PERMISSIONS.REFUNDS_WRITE,
  ],
  [ROLES.MANAGE_PRODUCT]: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_WRITE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.CATEGORIES_WRITE,
    PERMISSIONS.PACKAGES_READ,
    PERMISSIONS.PACKAGES_WRITE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
  ],
  [ROLES.SALES]: [
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_WRITE,
    PERMISSIONS.PROMOTIONS_READ,
    PERMISSIONS.PROMOTIONS_WRITE,
    PERMISSIONS.REFUNDS_READ,
    PERMISSIONS.REFUNDS_WRITE,
  ],
  [ROLES.INSIGHTS]: [PERMISSIONS.ANALYTICS_READ],
  [ROLES.CUSTOMER]: [],
};

export const DEFAULT_LOCALE = 'ar' as const;
export const SUPPORTED_LOCALES = ['ar', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const JORDAN_GOVERNORATES = [
  { code: 'AM', nameAr: 'عمان', nameEn: 'Amman' },
  { code: 'IR', nameAr: 'إربد', nameEn: 'Irbid' },
  { code: 'ZA', nameAr: 'الزرقاء', nameEn: 'Zarqa' },
  { code: 'BA', nameAr: 'البلقاء', nameEn: 'Balqa' },
  { code: 'MA', nameAr: 'المفرق', nameEn: 'Mafraq' },
  { code: 'AJ', nameAr: 'عجلون', nameEn: 'Ajloun' },
  { code: 'JR', nameAr: 'جرش', nameEn: 'Jerash' },
  { code: 'MD', nameAr: 'مادبا', nameEn: 'Madaba' },
  { code: 'KA', nameAr: 'الكرك', nameEn: 'Karak' },
  { code: 'AT', nameAr: 'الطفيلة', nameEn: 'Tafilah' },
  { code: 'MN', nameAr: 'معان', nameEn: "Ma'an" },
  { code: 'AQ', nameAr: 'العقبة', nameEn: 'Aqaba' },
] as const;

export const BRAND = {
  nameAr: 'النص أونلاين',
  nameEn: 'Al-Nass Online',
  currency: 'JOD',
  country: 'JO',
} as const;
