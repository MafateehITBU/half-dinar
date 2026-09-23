-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'meps';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paytabs_tran_ref" TEXT;
