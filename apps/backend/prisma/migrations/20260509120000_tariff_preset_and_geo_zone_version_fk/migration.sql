-- CreateTable
CREATE TABLE "tariff_preset" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price_per_minute" DECIMAL(19,2) NOT NULL,
    "price_per_km" DECIMAL(19,2) NOT NULL,
    "pause_price_per_minute" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tariff_preset_pkey" PRIMARY KEY ("id")
);

-- Migrate rows from legacy per-zone tariffs (ids preserved)
INSERT INTO "tariff_preset" ("id", "name", "price_per_minute", "price_per_km", "pause_price_per_minute", "is_default", "is_deleted", "created_at", "updated_at")
SELECT "id", "name", "price_per_minute", "price_per_km", 0, false, ("deleted_at" IS NOT NULL), "created_at", "updated_at"
FROM "tariff";

-- AlterTable
ALTER TABLE "geo_zone_version" ADD COLUMN "tariff_preset_id" UUID;

ALTER TABLE "geo_zone_version" ADD CONSTRAINT "geo_zone_version_tariff_preset_id_fkey" FOREIGN KEY ("tariff_preset_id") REFERENCES "tariff_preset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "geo_zone_version_tariff_preset_id_idx" ON "geo_zone_version"("tariff_preset_id");

-- Trip: rename FK to geo_zone_version_id
ALTER TABLE "trip" DROP CONSTRAINT "trip_tariff_version_id_fkey";

DROP INDEX IF EXISTS "trip_tariff_version_id_idx";

ALTER TABLE "trip" RENAME COLUMN "tariff_version_id" TO "geo_zone_version_id";

ALTER TABLE "trip" ADD CONSTRAINT "trip_geo_zone_version_id_fkey" FOREIGN KEY ("geo_zone_version_id") REFERENCES "geo_zone_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "trip_geo_zone_version_id_idx" ON "trip"("geo_zone_version_id");

-- DropTable
DROP TABLE "tariff";
