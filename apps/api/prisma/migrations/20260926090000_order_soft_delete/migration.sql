-- Soft-delete orders so they leave lists/stats without destroying audit/refund rows
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "orders_deleted_at_idx" ON "orders"("deleted_at");
