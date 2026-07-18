import { useRef } from 'react';
import { Icon } from '@iconify/react';

const MAX_MB = 5;

interface ProductImageUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  cloudinaryEnabled: boolean;
  maxImages?: number;
  label?: string;
  folderHint?: string;
}

export function ProductImageUpload({
  files,
  onChange,
  disabled,
  cloudinaryEnabled,
  maxImages = 10,
  label = 'صور المنتج',
  folderHint = 'Cloudinary',
}: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const next = [...files];
    for (const file of Array.from(list)) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > MAX_MB * 1024 * 1024) continue;
      if (next.length >= maxImages) break;
      next.push(file);
    }
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  if (!cloudinaryEnabled) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <Icon icon="mdi:cloud-off-outline" className="mb-2 text-2xl" />
        <p className="font-semibold">رفع الصور غير متاح</p>
        <p className="mt-1 text-amber-800">
          عيّن <code className="rounded bg-amber-100 px-1">CLOUDINARY_CLOUD_NAME</code> و{' '}
          <code className="rounded bg-amber-100 px-1">CLOUDINARY_API_KEY</code> و{' '}
          <code className="rounded bg-amber-100 px-1">CLOUDINARY_API_SECRET</code> في{' '}
          <code className="rounded bg-amber-100 px-1">apps/api/.env</code> ثم أعد تشغيل الـ API.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('border-primary', 'bg-primary-50/50');
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('border-primary', 'bg-primary-50/50');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-primary', 'bg-primary-50/50');
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center transition ${
          disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-primary hover:bg-primary-50/30'
        }`}
      >
        <Icon icon="mdi:cloud-upload-outline" className="text-4xl text-primary" />
        <p className="mt-2 font-medium text-slate-800">{label}</p>
        <p className="mt-1 text-xs text-slate-500">
          {maxImages === 1 ? 'صورة واحدة' : `حتى ${maxImages} صور`} — JPEG, PNG, WebP — {MAX_MB} م.ب كحد أقصى ({folderHint})
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple={maxImages > 1}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className="aspect-square w-full object-cover"
                onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeAt(i)}
                className="absolute left-1 top-1 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                aria-label="حذف"
              >
                <Icon icon="mdi:close" className="text-sm" />
              </button>
              <p className="truncate px-2 py-1 text-[10px] text-slate-500">{file.name}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
