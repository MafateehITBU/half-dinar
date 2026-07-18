import { toast } from 'sonner';
import Swal from 'sweetalert2';

const toastBase = {
  classNames: {
    toast: 'brand-toast',
    title: 'brand-toast-title',
    description: 'brand-toast-desc',
    actionButton: 'brand-toast-action',
    closeButton: 'brand-toast-close',
    success: 'brand-toast-success',
    error: 'brand-toast-error',
    info: 'brand-toast-info',
  },
};

export function showSuccess(message: string, action?: { label: string; onClick: () => void }) {
  toast.success(message, {
    ...toastBase,
    action: action ? { label: action.label, onClick: action.onClick } : undefined,
  });
}

export function showError(message: string) {
  toast.error(message, toastBase);
}

export function showInfo(message: string) {
  toast.info(message, toastBase);
}

export async function confirmAction(
  title: string,
  text: string,
  confirmText = 'نعم',
  cancelText = 'إلغاء',
): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: '#0d9488',
    cancelButtonColor: '#64748b',
    reverseButtons: true,
  });
  return result.isConfirmed;
}
