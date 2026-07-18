import { useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import type { ProductImage } from '@half-dinar/shared';
import { adminApi } from '../lib/api';

interface ProductImagesEditorProps {
  productId: string;
  images: ProductImage[];
  cloudinaryEnabled: boolean;
  maxImages: number;
  onChange: (images: ProductImage[]) => void;
}

export function ProductImagesEditor({
  productId,
  images,
  cloudinaryEnabled,
  maxImages,
  onChange,
}: ProductImagesEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const remaining = maxImages - images.length;

  const uploadFiles = async (list: FileList | null) => {
    if (!list?.length || !cloudinaryEnabled) return;
    const files = Array.from(list).slice(0, remaining);
    if (!files.length) return;

    setError('');
    setUploading(true);
    try {
      await adminApi.uploadProductImages(productId, files);
      const { data } = await adminApi.getProduct(productId);
      const next = (data as { images?: ProductImage[] }).images ?? [];
      onChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل رفع الصور');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (imageId: string) => {
    setError('');
    setDeletingId(imageId);
    try {
      await adminApi.deleteProductImage(productId, imageId);
      onChange(images.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف الصورة');
    } finally {
      setDeletingId(null);
    }
  };

  if (!cloudinaryEnabled) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">إدارة الصور غير متاحة</p>
        <p className="mt-1 text-amber-800">فعّل Cloudinary في apps/api/.env لرفع الصور.</p>
      </div>
    );
  }

  return (
    <fieldset className="space-y-4">
      <legend className="flex w-full items-center justify-between text-sm font-bold text-slate-800">
        <span>٣ — صور المنتج</span>
        <span className="text-xs font-medium text-slate-500">
          {images.length} / {maxImages}
        </span>
      </legend>

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.id} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img src={img.url} alt={img.altAr ?? ''} className="aspect-square w-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-2 right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                  رئيسية
                </span>
              )}
              <button
                type="button"
                disabled={deletingId === img.id || uploading}
                onClick={() => removeImage(img.id)}
                className="absolute left-1 top-1 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700 disabled:opacity-50"
                aria-label="حذف الصورة"
              >
                <Icon icon="mdi:close" className="text-sm" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 && (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && !uploading && inputRef.current?.click()}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-6 py-8 text-center transition hover:border-primary hover:bg-primary-50/30 ${
            uploading ? 'cursor-wait opacity-60' : ''
          }`}
        >
          <Icon icon={uploading ? 'mdi:loading' : 'mdi:image-plus'} className={`text-3xl text-primary ${uploading ? 'animate-spin' : ''}`} />
          <p className="mt-2 text-sm font-medium text-slate-800">
            {uploading ? 'جاري الرفع...' : 'أضف صوراً'}
          </p>
          <p className="mt-1 text-xs text-slate-500">حتى {remaining} صورة إضافية</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              uploadFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <Icon icon="mdi:alert-circle-outline" />
          {error}
        </p>
      )}
    </fieldset>
  );
}
