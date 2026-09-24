import { formatApiError } from './errors.js';

const API_BASE = '/api/v1';

export interface PublicConfig {
  meps?: { enabled: boolean };
  googleAuth?: { enabled: boolean; clientId: string };
}

export interface SavedAddress {
  id: string;
  label: string | null;
  governorate: string;
  city: string;
  street: string;
  building: string | null;
  phone: string;
  isDefault: boolean;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getCartHeaders(): HeadersInit {
  const token = localStorage.getItem('cartToken');
  return token ? { 'X-Cart-Token': token } : {};
}

async function request<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...getCartHeaders(),
      ...options.headers,
    },
  });

  const cartToken = res.headers.get('X-Cart-Token');
  if (cartToken) localStorage.setItem('cartToken', cartToken);

  if (res.status === 401 && !retried && !path.startsWith('/auth/')) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const data = (await refreshRes.json()) as {
            tokens: { accessToken: string; refreshToken: string };
          };
          saveAuthTokens(data.tokens.accessToken, data.tokens.refreshToken);
          return request<T>(path, options, true);
        }
      } catch {
        // fall through to logout
      }
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401 && typeof window !== 'undefined') {
      const hadToken = localStorage.getItem('accessToken');
      if (hadToken) {
        clearAuth();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?session=expired';
        }
      }
    }
    throw new Error(formatApiError(body, `Request failed: ${res.status}`));
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ user: unknown; tokens: { accessToken: string; refreshToken: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    ),
  register: (data: Record<string, unknown>) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  loginWithGoogle: (idToken: string, referralCode?: string) =>
    request<{ user: unknown; tokens: { accessToken: string; refreshToken: string } }>(
      '/auth/google',
      {
        method: 'POST',
        body: JSON.stringify({ idToken, referralCode: referralCode || undefined }),
      },
    ),
  verifyEmail: (token: string) =>
    request<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  mergeCart: () => request('/cart/merge', { method: 'POST', body: '{}' }),
  getAddresses: () => request<{ data: SavedAddress[] }>('/users/me/addresses'),
  createAddress: (data: Record<string, unknown>) =>
    request<{ data: SavedAddress }>('/users/me/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAddress: (id: string, data: Record<string, unknown>) =>
    request<{ data: SavedAddress }>(`/users/me/addresses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteAddress: (id: string) =>
    request<void>(`/users/me/addresses/${id}`, { method: 'DELETE' }),
  setDefaultAddress: (id: string) =>
    request<{ data: SavedAddress }>(`/users/me/addresses/${id}/default`, {
      method: 'POST',
      body: '{}',
    }),
  getCategories: () => request<{ data: unknown[] }>('/categories'),
  getProducts: (params: URLSearchParams) =>
    request<{ data: unknown[]; pagination: unknown }>(`/products?${params}`),
  getProduct: (slug: string) => request<{ data: unknown }>(`/products/${slug}`),
  searchSuggest: (q: string) => request<{ data: unknown[] }>(`/search/suggest?q=${encodeURIComponent(q)}`),
  getCart: () => request<{ data: unknown }>('/cart'),
  addToCart: (data: { productId?: string; packageId?: string; quantity: number }) =>
    request<{ data: unknown }>('/cart/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCartItem: (type: 'product' | 'package', id: string, quantity: number) =>
    request<{ data: unknown }>(`/cart/items/${type}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
  removeCartItem: (type: 'product' | 'package', id: string) =>
    request<{ data: unknown }>(`/cart/items/${type}/${id}`, { method: 'DELETE' }),
  getPackages: () => request<{ data: unknown[] }>('/packages'),
  getPackage: (slug: string) => request<{ data: unknown }>(`/packages/${slug}`),
  getProductReviews: (slug: string) => request<{ data: unknown }>(`/reviews/product/${slug}`),
  createReview: (data: Record<string, unknown>) =>
    request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  getWishlist: () => request<{ data: unknown }>('/wishlist'),
  toggleWishlist: (productId: string) =>
    request<{ data: unknown }>('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    }),
  checkWishlist: (productId: string) =>
    request<{ data: { inWishlist: boolean } }>(`/wishlist/check/${productId}`),
  compareProducts: (ids: string[]) =>
    request<{ data: unknown[] }>(`/products/compare?ids=${ids.join(',')}`),
  getShippingZones: () => request<{ data: unknown[] }>('/checkout/shipping-zones'),
  getCheckoutQuote: (governorateCode: string, couponCode?: string, loyaltyPointsToUse?: number) =>
    request<{ data: unknown }>('/checkout/quote', {
      method: 'POST',
      body: JSON.stringify({ governorateCode, couponCode, loyaltyPointsToUse }),
    }),
  getPublicConfig: () => request<{ data: unknown }>('/public/config'),
  getLoyalty: () => request<{ data: unknown }>('/loyalty'),
  getReferral: () => request<{ data: unknown }>('/referral/me'),
  subscribeNewsletter: (data: { email: string; newsletter?: boolean; offers?: boolean }) =>
    request('/newsletter/subscribe', { method: 'POST', body: JSON.stringify(data) }),
  getCmsHome: () => request<{ data: unknown }>('/cms/home'),
  getCmsPage: (slug: string) => request<{ data: unknown }>(`/cms/pages/${slug}`),
  getContact: () => request<{ data: unknown }>('/cms/contact'),
  submitContact: (data: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
  }) =>
    request<{ data: unknown; message: string }>('/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getFlashOffers: () => request<{ data: unknown }>('/promotions/flash'),
  getBlogPosts: () => request<{ data: unknown[] }>('/blog'),
  getBlogPost: (slug: string) => request<{ data: unknown }>(`/blog/${slug}`),
  placeOrder: (data: Record<string, unknown>) =>
    request<{ data: unknown }>('/checkout/place-order', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  confirmMepsPayment: (orderId: string) =>
    request('/checkout/meps/confirm', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    }),
  getOrders: () => request<{ data: unknown[] }>('/orders'),
  getOrder: (id: string) => request<{ data: unknown }>(`/orders/${id}`),
  getProfile: () => request<{ data: unknown }>('/users/me'),
  updateProfile: (data: Record<string, unknown>) =>
    request<{ data: unknown }>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const body = refreshToken ? JSON.stringify({ refreshToken }) : '{}';
    return request<void>('/auth/logout', { method: 'POST', body }).finally(() => clearAuth());
  },
  createRefund: (data: Record<string, unknown>) =>
    request('/refunds', { method: 'POST', body: JSON.stringify(data) }),
  getProductJsonLd: (slug: string) =>
    request<{ data: Record<string, unknown> }>(`/seo/product/${slug}/jsonld`),
};

export function saveAuthTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearAuth() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function isLoggedIn() {
  return Boolean(localStorage.getItem('accessToken'));
}

const API_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';

export async function openOrderInvoice(orderId: string, format: 'html' | 'pdf') {
  const token = localStorage.getItem('accessToken');
  const path = format === 'pdf' ? `/orders/${orderId}/invoice.pdf` : `/orders/${orderId}/invoice`;
  const url = `${API_ORIGIN}${API_BASE}${path}`;
  if (format === 'html') {
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (!res.ok) throw new Error('تعذر تحميل الفاتورة');
    const html = await res.text();
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
    return;
  }
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) throw new Error('تعذر تحميل PDF');
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `invoice-${orderId}.pdf`;
  a.click();
  URL.revokeObjectURL(blobUrl);
}
