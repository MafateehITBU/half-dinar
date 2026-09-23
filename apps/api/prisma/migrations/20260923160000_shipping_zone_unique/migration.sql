-- Deduplicate governorate codes if any, then add unique index
DELETE FROM "shipping_rates"
WHERE "zone_id" IN (
  SELECT id FROM "shipping_zones" z
  WHERE z.id NOT IN (
    SELECT DISTINCT ON ("governorate_code") id
    FROM "shipping_zones"
    ORDER BY "governorate_code", "created_at" ASC
  )
);

DELETE FROM "shipping_zones"
WHERE id NOT IN (
  SELECT DISTINCT ON ("governorate_code") id
  FROM "shipping_zones"
  ORDER BY "governorate_code", "created_at" ASC
);

CREATE UNIQUE INDEX IF NOT EXISTS "shipping_zones_governorate_code_key"
ON "shipping_zones"("governorate_code");
