import { showWarning } from './confirm';

export interface BulkActionResult {
  deleted: number;
  failed: Array<{ id: string; reason: string }>;
}

export interface BulkUpdateResult {
  updated: number;
}

/** Show partial-failure details when a bulk action completes with errors. */
export async function reportBulkResult(result: BulkActionResult, verb: string) {
  if (result.failed.length === 0) return;
  const reasons = [...new Set(result.failed.map((f) => f.reason))].join(' — ');
  await showWarning(`${verb}: ${result.deleted} نجح، ${result.failed.length} فشل.\n${reasons}`, 'اكتمل جزئياً');
}
