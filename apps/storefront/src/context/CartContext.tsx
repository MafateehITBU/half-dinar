import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CartResponse } from '@half-dinar/shared';
import { api } from '../lib/api';
import { showError, showInfo, showSuccess } from '../lib/toast';

interface CartContextValue {
  cart: CartResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  addPackage: (packageId: string, quantity?: number) => Promise<void>;
  updateItem: (type: 'product' | 'package', id: string, quantity: number) => Promise<void>;
  removeItem: (type: 'product' | 'package', id: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

function cartAction(navigate: ReturnType<typeof useNavigate>) {
  return { label: 'عرض السلة', onClick: () => navigate('/cart') };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.getCart();
      setCart(res.data as CartResponse);
    } catch {
      setCart({ items: [], subtotal: 0, itemCount: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = async (productId: string, quantity = 1) => {
    try {
      const res = await api.addToCart({ productId, quantity });
      const next = res.data as CartResponse;
      setCart(next);
      const item = next.items.find((i) => i.productId === productId);
      const label = item?.nameAr ?? 'المنتج';
      showSuccess(
        quantity > 1 ? `أُضيف ${quantity}× «${label}» للسلة` : `أُضيف «${label}» للسلة`,
        cartAction(navigate),
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : 'تعذرت الإضافة للسلة');
      throw err;
    }
  };

  const addPackage = async (packageId: string, quantity = 1) => {
    try {
      const res = await api.addToCart({ packageId, quantity });
      const next = res.data as CartResponse;
      setCart(next);
      const item = next.items.find((i) => i.packageId === packageId);
      const label = item?.nameAr ?? 'الباقة';
      showSuccess(
        quantity > 1 ? `أُضيف ${quantity}× «${label}» للسلة` : `أُضيف «${label}» للسلة`,
        cartAction(navigate),
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : 'تعذرت الإضافة للسلة');
      throw err;
    }
  };

  const updateItem = async (type: 'product' | 'package', id: string, quantity: number) => {
    try {
      const res = await api.updateCartItem(type, id, quantity);
      setCart(res.data as CartResponse);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'تعذر تحديث الكمية');
      throw err;
    }
  };

  const removeItem = async (type: 'product' | 'package', id: string) => {
    const item = cart?.items.find((i) =>
      type === 'product' ? i.productId === id : i.packageId === id,
    );
    try {
      const res = await api.removeCartItem(type, id);
      setCart(res.data as CartResponse);
      showInfo(item ? `حُذف «${item.nameAr}» من السلة` : 'تم الحذف من السلة');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'تعذر الحذف');
      throw err;
    }
  };

  return (
    <CartContext.Provider value={{ cart, loading, refresh, addItem, addPackage, updateItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
