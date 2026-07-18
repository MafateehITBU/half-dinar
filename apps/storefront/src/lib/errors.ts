import type { ZodIssue } from 'zod';

interface ApiErrorBody {
  error?: {
    message?: string;
    details?: ZodIssue[] | unknown;
  };
}

export function formatApiError(body: ApiErrorBody, fallback: string): string {
  const details = body?.error?.details;
  if (Array.isArray(details) && details.length > 0) {
    const messages = details
      .map((d) => {
        if (d && typeof d === 'object' && 'message' in d) {
          return String((d as { message: string }).message);
        }
        return null;
      })
      .filter(Boolean);
    if (messages.length) return messages.join(' — ');
  }
  return body?.error?.message ?? fallback;
}

export function formatZodErrors(error: { issues: { path: (string | number)[]; message: string }[] }): string {
  return error.issues.map((i) => i.message).join(' — ');
}
