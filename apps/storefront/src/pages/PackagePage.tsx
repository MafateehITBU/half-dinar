import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import type { PackageDetail } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { ProductImage } from '../components/ProductImage';
import { RichText } from '../components/RichText';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';

const MAX_PACKAGE_QTY = 99;

export function PackagePage() {
  const { slug } = useParams<{ slug: string }>();
  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [qty, setQty] = useState(1);
  const { addPackage } = useCart();

  useEffect(() => {
    if (!slug) return;
    api.getPackage(slug).then((res) => setPkg(res.data as PackageDetail));
  }, [slug]);

  if (!pkg) {
    return (
      <Layout>
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="h-96 animate-pulse rounded-2xl bg-brand-sand" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl shadow-card">
            <ProductImage src={pkg.imageUrl} alt={pkg.nameAr} aspectClass="aspect-square" />
          </div>
          <div>
            <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-amber-800">باقة موفرة</span>
            <h1 className="mt-3 text-3xl font-bold">{pkg.nameAr}</h1>
            <p className="mt-1 text-brand-muted">{pkg.nameEn}</p>
            <p className="mt-6 text-3xl font-bold text-primary-700">{pkg.price.toFixed(2)} د.أ</p>
            <p className="text-sm text-brand-muted line-through">قيمة المنتجات: {pkg.retailTotal.toFixed(2)} د.أ</p>
            {pkg.savings > 0 && (
              <p className="mt-2 font-medium text-green-600">توفير {pkg.savings.toFixed(2)} د.أ</p>
            )}
            {pkg.descriptionAr && (
              <RichText html={pkg.descriptionAr} className="mt-6 text-brand-muted" />
            )}

            <h3 className="mt-8 font-bold">محتويات الباقة</h3>
            <ul className="mt-3 space-y-2 rounded-xl bg-brand-cream p-4">
              {pkg.items.map((i) => (
                <li key={i.productId} className="flex justify-between text-sm">
                  <Link to={`/products/${i.product.slug}`} className="font-medium hover:text-primary-600">
                    {i.product.nameAr} × {i.quantity}
                  </Link>
                  <span>{(i.product.price * i.quantity).toFixed(2)} د.أ</span>
                </li>
              ))}
            </ul>

            {pkg.inStock && (
              <div className="pd-buy mt-8">
                <div className="pd-qty">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    aria-label="تقليل"
                  >
                    <Icon icon="mdi:minus" />
                  </button>
                  <span>{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(MAX_PACKAGE_QTY, q + 1))}
                    disabled={qty >= MAX_PACKAGE_QTY}
                    aria-label="زيادة"
                  >
                    <Icon icon="mdi:plus" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => addPackage(pkg.id, qty)}
                  className="pd-buy-btn"
                >
                  <Icon icon="mdi:cart-outline" />
                  أضف الباقة · {(pkg.price * qty).toFixed(2)} د.أ
                </button>
              </div>
            )}
          </div>
        </div>
        <Link to="/packages" className="mt-8 inline-flex text-primary-600 hover:underline">← جميع الباقات</Link>
      </div>
    </Layout>
  );
}
