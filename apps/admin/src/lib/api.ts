import type { AdminCreateUserInput, AdminUpdateUserInput, AdminUserSummary, PaginationMeta } from '@half-dinar/shared';

const API_BASE = '/api/v1';
const ACCESS_KEY = 'adminAccessToken';
const REFRESH_KEY = 'adminRefreshToken';

export type PaginatedResponse<T> = { data: T[]; pagination: PaginationMeta };

type AuthTokens = { accessToken: string; refreshToken: string; expiresIn?: number };

function buildQuery(params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(ACCESS_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function saveAdminTokens(tokens: AuthTokens) {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

function clearAdminTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function forceLogin() {
  clearAdminTokens();
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

/** Single in-flight refresh so parallel 401s don't rotate the refresh token twice. */
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { tokens: AuthTokens };
      if (!data?.tokens?.accessToken || !data?.tokens?.refreshToken) return false;
      saveAdminTokens(data.tokens);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function handleUnauthorized(path: string, retry: () => Promise<Response>): Promise<Response | null> {
  // Don't try to refresh the login/refresh calls themselves
  if (path.startsWith('/auth/login') || path.startsWith('/auth/refresh')) {
    return null;
  }
  const ok = await tryRefreshAccessToken();
  if (!ok) {
    forceLogin();
    return null;
  }
  return retry();
}

async function postFormData<T>(path: string, formData: FormData, method = 'POST'): Promise<T> {
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      method,
      headers: authHeaders(),
      body: formData,
    });

  let res = await doFetch();

  if (res.status === 401) {
    const retried = await handleUnauthorized(path, doFetch);
    if (!retried) throw new Error('Unauthorized');
    res = retried;
    if (res.status === 401) {
      forceLogin();
      throw new Error('Unauthorized');
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

function buildProductFormData(
  fields: Record<string, string | boolean>,
  files: File[],
): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === 'boolean') {
      fd.append(k, v ? 'true' : 'false');
    } else if (v !== undefined && v !== '') {
      fd.append(k, v);
    }
  }
  fd.append('isActive', 'true');
  for (const file of files) fd.append('images', file);
  return fd;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...options.headers,
      },
    });

  let res = await doFetch();

  if (res.status === 401) {
    const retried = await handleUnauthorized(path, doFetch);
    if (!retried) throw new Error('Unauthorized');
    res = retried;
    if (res.status === 401) {
      forceLogin();
      throw new Error('Unauthorized');
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const adminApi = {
  login: (email: string, password: string) =>
    request<{ user: { roles: string[] }; tokens: AuthTokens }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getCategories: () => request<{ data: unknown[] }>('/admin/categories'),
  createCategory: (data: Record<string, unknown>) =>
    request('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),

  createCategoryWithImage: (
    data: { nameAr: string; nameEn: string; parentId?: string; icon?: string },
    image?: File,
  ) => {
    const fd = new FormData();
    fd.append('nameAr', data.nameAr);
    fd.append('nameEn', data.nameEn);
    fd.append('isActive', 'true');
    if (data.parentId) fd.append('parentId', data.parentId);
    if (data.icon) fd.append('icon', data.icon);
    if (image) fd.append('image', image);
    return postFormData<{ data: unknown }>('/admin/categories', fd);
  },

  uploadCategoryImage: (categoryId: string, image: File) => {
    const fd = new FormData();
    fd.append('image', image);
    return postFormData<{ data: unknown }>(`/admin/categories/${categoryId}/image`, fd, 'PATCH');
  },
  updateCategory: (id: string, data: Record<string, unknown>) =>
    request(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  updateCategoryWithImage: (
    id: string,
    data: {
      nameAr: string;
      nameEn: string;
      parentId?: string | null;
      isActive: boolean;
      icon?: string | null;
    },
    image?: File,
  ) => {
    if (image) {
      const fd = new FormData();
      fd.append('nameAr', data.nameAr);
      fd.append('nameEn', data.nameEn);
      fd.append('isActive', data.isActive ? 'true' : 'false');
      if (data.parentId) fd.append('parentId', data.parentId);
      else fd.append('parentId', '');
      if (data.icon) fd.append('icon', data.icon);
      else fd.append('icon', '');
      fd.append('image', image);
      return postFormData<{ data: unknown }>(`/admin/categories/${id}`, fd, 'PATCH');
    }
    return adminApi.updateCategory(id, data);
  },
  deleteCategory: (id: string) =>
    request(`/admin/categories/${id}`, { method: 'DELETE' }),
  getProducts: (page = 1, limit = 20) =>
    request<PaginatedResponse<unknown>>(`/admin/products${buildQuery({ page, limit })}`),

  getProduct: (id: string) => request<{ data: Record<string, unknown> }>(`/admin/products/${id}`),

  getProductPicker: () =>
    request<{
      data: Array<{
        id: string;
        sku: string;
        nameAr: string;
        price: number;
        stockQuantity: number;
        imageUrl: string | null;
        categoryId: string;
        categorySlug: string;
        categoryNameAr: string;
      }>;
    }>('/admin/products/picker'),
  createProduct: (data: Record<string, unknown>) =>
    request('/admin/products', { method: 'POST', body: JSON.stringify(data) }),

  getProductMediaConfig: () =>
    request<{ data: { cloudinary: boolean; maxImages: number; maxSizeMb: number } }>(
      '/admin/products/media-config',
    ),

  createProductWithImages: (
    data: {
      sku?: string;
      nameAr: string;
      nameEn: string;
      descriptionAr?: string;
      descriptionEn?: string;
      price: string;
      stockQuantity: string;
      categoryId: string;
      isFeatured?: boolean;
    },
    files: File[],
  ) => postFormData<{ data: unknown }>('/admin/products', buildProductFormData(data, files)),

  uploadProductImages: (productId: string, files: File[]) =>
    postFormData<{ data: { url: string; publicId: string }[] }>(
      `/admin/products/${productId}/images`,
      buildProductFormData({}, files),
    ),

  deleteProductImage: (productId: string, imageId: string) =>
    request(`/admin/products/${productId}/images/${imageId}`, { method: 'DELETE' }),
  updateProduct: (id: string, data: Record<string, unknown>) =>
    request(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProduct: (id: string) =>
    request(`/admin/products/${id}`, { method: 'DELETE' }),
  getOrders: (params: { page?: number; limit?: number; status?: string } = {}) =>
    request<PaginatedResponse<unknown>>(`/admin/orders${buildQuery(params)}`),
  getOrder: (id: string) => request<{ data: unknown }>(`/admin/orders/${id}`),
  updateOrderStatus: (id: string, status: string, note?: string) =>
    request(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),
  getCoupons: () => request<{ data: unknown[] }>('/admin/promotions/coupons'),
  createCoupon: (data: Record<string, unknown>) =>
    request('/admin/promotions/coupons', { method: 'POST', body: JSON.stringify(data) }),
  deleteCoupon: (id: string) => request(`/admin/promotions/coupons/${id}`, { method: 'DELETE' }),
  getCampaigns: () => request<{ data: unknown[] }>('/admin/promotions/campaigns'),
  createCampaign: (data: Record<string, unknown>) =>
    request('/admin/promotions/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  deleteCampaign: (id: string) => request(`/admin/promotions/campaigns/${id}`, { method: 'DELETE' }),
  getHeroSlides: () => request<{ data: unknown[] }>('/admin/cms/hero-slides'),
  createHeroSlide: (data: Record<string, unknown>) =>
    request('/admin/cms/hero-slides', { method: 'POST', body: JSON.stringify(data) }),
  updateHeroSlide: (id: string, data: Record<string, unknown>) =>
    request(`/admin/cms/hero-slides/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteHeroSlide: (id: string) => request(`/admin/cms/hero-slides/${id}`, { method: 'DELETE' }),
  getCmsPages: () => request<{ data: unknown[] }>('/admin/cms/pages'),
  createCmsPage: (data: Record<string, unknown>) =>
    request('/admin/cms/pages', { method: 'POST', body: JSON.stringify(data) }),
  updateCmsPage: (id: string, data: Record<string, unknown>) =>
    request(`/admin/cms/pages/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCmsPage: (id: string) => request(`/admin/cms/pages/${id}`, { method: 'DELETE' }),
  getBlogPosts: () => request<{ data: unknown[] }>('/admin/cms/blog'),
  createBlogPost: (data: Record<string, unknown>) =>
    request('/admin/cms/blog', { method: 'POST', body: JSON.stringify(data) }),
  updateBlogPost: (id: string, data: Record<string, unknown>) =>
    request(`/admin/cms/blog/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteBlogPost: (id: string) => request(`/admin/cms/blog/${id}`, { method: 'DELETE' }),
  getPackages: () => request<{ data: unknown[] }>('/admin/packages'),
  createPackage: (data: Record<string, unknown>) =>
    request('/admin/packages', { method: 'POST', body: JSON.stringify(data) }),

  createPackageWithImage: (
    data: { nameAr: string; nameEn: string; price: string; items: { productId: string; quantity: number }[] },
    image?: File,
  ) => {
    const fd = new FormData();
    fd.append('nameAr', data.nameAr);
    fd.append('nameEn', data.nameEn);
    fd.append('price', data.price);
    fd.append('isActive', 'true');
    fd.append('items', JSON.stringify(data.items));
    if (image) fd.append('image', image);
    return postFormData<{ data: unknown }>('/admin/packages', fd);
  },
  getPackage: (id: string) => request<{ data: Record<string, unknown> }>(`/admin/packages/${id}`),
  updatePackage: (id: string, data: Record<string, unknown>) =>
    request(`/admin/packages/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePackage: (id: string) => request(`/admin/packages/${id}`, { method: 'DELETE' }),
  getLowStock: () => request<{ data: unknown[]; count: number }>('/admin/inventory/low-stock'),
  adjustInventory: (data: Record<string, unknown>) =>
    request('/admin/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),
  getReviews: (status: string, page = 1, limit = 20) =>
    request<PaginatedResponse<unknown>>(`/admin/reviews${buildQuery({ status, page, limit })}`),
  moderateReview: (id: string, status: string) =>
    request(`/admin/reviews/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getAnalytics: (days = 30) =>
    request<{ data: unknown }>(`/admin/analytics/dashboard?days=${days}`),
  getRefunds: (status: string, page = 1, limit = 20) =>
    request<PaginatedResponse<unknown>>(`/admin/refunds${buildQuery({ status, page, limit })}`),
  moderateRefund: (id: string, status: string, adminNotes?: string) =>
    request(`/admin/refunds/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNotes }),
    }),
  importProducts: (csv: string) =>
    request<{ data: { created: number; updated: number; errors: string[] } }>(
      '/admin/bulk/products/import',
      { method: 'POST', body: JSON.stringify({ csv }) },
    ),
  exportAuditLog: () => '/api/v1/admin/audit/export',
  getSettings: () => request<{ data: unknown }>('/admin/settings'),
  updateSettings: (data: Record<string, string | number>) =>
    request('/admin/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  getNewsletterSubscribers: (page = 1, limit = 20) =>
    request<PaginatedResponse<unknown>>(`/admin/newsletter${buildQuery({ page, limit })}`),

  getContactMessages: (page = 1, limit = 20, status = 'new') =>
    request<PaginatedResponse<unknown>>(`/admin/contact-messages${buildQuery({ page, limit, status })}`),

  getContactMessage: (id: string) => request<{ data: unknown }>(`/admin/contact-messages/${id}`),

  getContactStats: () => request<{ data: { newCount: number } }>('/admin/contact-messages/stats'),

  updateContactMessage: (id: string, status: 'new' | 'read' | 'archived') =>
    request(`/admin/contact-messages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getUsers: (params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    active?: string;
  } = {}) => request<PaginatedResponse<AdminUserSummary>>(`/admin/users${buildQuery(params)}`),

  getUser: (id: string) => request<{ data: AdminUserSummary }>(`/admin/users/${id}`),

  getRoles: () =>
    request<{ data: { id: string; slug: string; nameAr: string; nameEn: string }[] }>('/admin/users/roles'),

  createUser: (data: AdminCreateUserInput) =>
    request<{ data: AdminUserSummary }>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),

  updateUser: (id: string, data: AdminUpdateUserInput) =>
    request<{ data: AdminUserSummary }>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deactivateUser: (id: string) => request(`/admin/users/${id}`, { method: 'DELETE' }),

  resendUserVerification: (id: string) =>
    request<{ message: string }>(`/admin/users/${id}/resend-verification`, { method: 'POST', body: '{}' }),

  bulkDeleteProducts: (ids: string[]) =>
    request<{ data: import('./bulk.js').BulkActionResult }>('/admin/bulk/products/delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  bulkDeleteCategories: (ids: string[]) =>
    request<{ data: import('./bulk.js').BulkActionResult }>('/admin/bulk/categories/delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  bulkDeleteCoupons: (ids: string[]) =>
    request<{ data: import('./bulk.js').BulkActionResult }>('/admin/bulk/coupons/delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  bulkDeleteCampaigns: (ids: string[]) =>
    request<{ data: import('./bulk.js').BulkActionResult }>('/admin/bulk/campaigns/delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  bulkDeletePackages: (ids: string[]) =>
    request<{ data: import('./bulk.js').BulkActionResult }>('/admin/bulk/packages/delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  bulkDeactivateUsers: (ids: string[]) =>
    request<{ data: import('./bulk.js').BulkActionResult }>('/admin/bulk/users/deactivate', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  bulkUpdateContactStatus: (ids: string[], status: 'new' | 'read' | 'archived') =>
    request<{ data: import('./bulk.js').BulkUpdateResult }>('/admin/bulk/contact/status', {
      method: 'POST',
      body: JSON.stringify({ ids, status }),
    }),

  bulkModerateReviews: (ids: string[], status: 'approved' | 'rejected') =>
    request<{ data: import('./bulk.js').BulkActionResult }>('/admin/bulk/reviews/status', {
      method: 'POST',
      body: JSON.stringify({ ids, status }),
    }),
};

export function isAdminLoggedIn() {
  return Boolean(localStorage.getItem(ACCESS_KEY));
}

export function adminLogout() {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  clearAdminTokens();
  if (refreshToken) {
    void fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }
}

export async function openAdminOrderInvoice(orderId: string, format: 'html' | 'pdf') {
  const token = localStorage.getItem(ACCESS_KEY);
  const path = format === 'pdf' ? `/admin/orders/${orderId}/invoice.pdf` : `/admin/orders/${orderId}/invoice`;
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      headers: token ? { Authorization: `Bearer ${localStorage.getItem(ACCESS_KEY)}` } : {},
    });

  let res = await doFetch();
  if (res.status === 401) {
    const retried = await handleUnauthorized(path, doFetch);
    if (!retried) throw new Error('تعذر تحميل الفاتورة');
    res = retried;
  }
  if (!res.ok) throw new Error('تعذر تحميل الفاتورة');
  if (format === 'html') {
    const html = await res.text();
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${orderId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
