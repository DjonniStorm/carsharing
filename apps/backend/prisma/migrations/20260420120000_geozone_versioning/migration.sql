-- GeoZone versioning: stable zone + GeoZoneVersion (MultiPolygon, JSON rules).
-- Destructive: clears trips/tariffs and old geo_zone (int PK) — dev-oriented migration.

DELETE FROM "violation_notification";
DELETE FROM "violation";
DELETE FROM "telemetry";
DELETE FROM "car_session_info";
DELETE FROM "trip";
DELETE FROM "tariff";

ALTER TABLE "tariff" DROP CONSTRAINT IF EXISTS "tariff_geo_zone_id_fkey";

DROP TABLE IF EXISTS "geo_zone";

-- CreateTable
CREATE TABLE "geo_zone" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "color" VARCHAR(64) NOT NULL,
    "current_version_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "created_by_user_id" UUID NOT NULL,

    CONSTRAINT "geo_zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_zone_version" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "geozone_id" UUID NOT NULL,
    "geometry" geometry(MultiPolygon,4326) NOT NULL,
    "rules" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabled_at" TIMESTAMP(3),

    CONSTRAINT "geo_zone_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "geo_zone_current_version_id_key" ON "geo_zone"("current_version_id");

-- CreateIndex
CREATE INDEX "geo_zone_version_geozone_id_idx" ON "geo_zone_version"("geozone_id");

-- AddForeignKey
ALTER TABLE "geo_zone_version" ADD CONSTRAINT "geo_zone_version_geozone_id_fkey" FOREIGN KEY ("geozone_id") REFERENCES "geo_zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_zone" ADD CONSTRAINT "geo_zone_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "geo_zone_version"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_zone" ADD CONSTRAINT "geo_zone_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable (tariff: int geo_zone_id -> uuid)
ALTER TABLE "tariff" DROP COLUMN "geo_zone_id";
ALTER TABLE "tariff" ADD COLUMN "geo_zone_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "tariff" ADD CONSTRAINT "tariff_geo_zone_id_fkey" FOREIGN KEY ("geo_zone_id") REFERENCES "geo_zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "tariff_geo_zone_id_idx" ON "tariff"("geo_zone_id");
