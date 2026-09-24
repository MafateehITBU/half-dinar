import Swal from 'sweetalert2';

const BRAND_GREEN = '#0b4745';
const SLATE = '#64748b';
const DANGER = '#dc2626';

/** Remove stuck SweetAlert2 backdrops that block clicks in the SPA. */
export function cleanupSwalBody() {
  Swal.close();
  document.querySelectorAll('.swal2-container').forEach((el) => el.remove());
  document.body.classList.remove('swal2-shown', 'swal2-height-auto');
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('padding-right');
  document.documentElement.classList.remove('swal2-shown', 'swal2-height-auto');
  document.documentElement.style.removeProperty('overflow');
  document.documentElement.style.removeProperty('padding-right');
}

function baseOptions() {
  return {
    reverseButtons: true,
    buttonsStyling: true,
    returnFocus: false,
    heightAuto: false,
    didClose: cleanupSwalBody,
    customClass: {
      popup: 'admin-swal-popup',
      title: 'admin-swal-title',
      htmlContainer: 'admin-swal-text',
      confirmButton: 'admin-swal-btn admin-swal-btn-confirm',
      cancelButton: 'admin-swal-btn admin-swal-btn-cancel',
    },
  };
}

/** Yes / no confirmation dialog. */
export async function confirmAction(
  title: string,
  text: string,
  options: {
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'danger';
    icon?: 'question' | 'warning';
  } = {},
): Promise<boolean> {
  const isDanger = options.variant === 'danger';
  try {
    const result = await Swal.fire({
      ...baseOptions(),
      title,
      text,
      icon: options.icon ?? (isDanger ? 'warning' : 'question'),
      showCancelButton: true,
      confirmButtonText: options.confirmText ?? 'نعم',
      cancelButtonText: options.cancelText ?? 'إلغاء',
      confirmButtonColor: isDanger ? DANGER : BRAND_GREEN,
      cancelButtonColor: SLATE,
      focusCancel: isDanger,
    });
    return result.isConfirmed;
  } finally {
    cleanupSwalBody();
  }
}

/** Shorthand for delete confirmations. */
export async function confirmDelete(message: string, title = 'تأكيد الحذف'): Promise<boolean> {
  return confirmAction(title, message, {
    confirmText: 'حذف',
    variant: 'danger',
    icon: 'warning',
  });
}

export async function showSuccess(message: string, title = 'تم') {
  try {
    await Swal.fire({
      ...baseOptions(),
      title,
      text: message,
      icon: 'success',
      confirmButtonText: 'حسناً',
      confirmButtonColor: BRAND_GREEN,
    });
  } finally {
    cleanupSwalBody();
  }
}

/** Non-blocking toast — preferred after inline saves so the dashboard stays clickable. */
export async function showToastSuccess(message: string) {
  try {
    await Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true,
      heightAuto: false,
      didClose: cleanupSwalBody,
    });
  } finally {
    cleanupSwalBody();
  }
}

export async function showToastError(message: string) {
  try {
    await Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: message,
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true,
      heightAuto: false,
      didClose: cleanupSwalBody,
    });
  } finally {
    cleanupSwalBody();
  }
}

export async function showWarning(message: string, title = 'تنبيه') {
  try {
    await Swal.fire({
      ...baseOptions(),
      title,
      text: message,
      icon: 'warning',
      confirmButtonText: 'حسناً',
      confirmButtonColor: BRAND_GREEN,
    });
  } finally {
    cleanupSwalBody();
  }
}

export async function showError(message: string, title = 'خطأ') {
  try {
    await Swal.fire({
      ...baseOptions(),
      title,
      text: message,
      icon: 'error',
      confirmButtonText: 'حسناً',
      confirmButtonColor: BRAND_GREEN,
    });
  } finally {
    cleanupSwalBody();
  }
}
