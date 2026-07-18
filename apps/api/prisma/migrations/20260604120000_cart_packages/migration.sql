-- AlterTable: cart items support packages
ALTER TABLE "cart_items" ALTER COLUMN "product_id" DROP NOT NULL;
ALTER TABLE "cart_items" ADD COLUMN "package_id" TEXT;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop old unique constraint
DROP INDEX IF EXISTS "cart_items_cart_id_product_id_key";

-- Partial unique indexes
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_key" ON "cart_items"("cart_id", "product_id") WHERE "product_id" IS NOT NULL;
CREATE UNIQUE INDEX "cart_items_cart_id_package_id_key" ON "cart_items"("cart_id", "package_id") WHERE "package_id" IS NOT NULL;
