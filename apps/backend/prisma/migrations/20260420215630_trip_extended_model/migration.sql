/*
  Warnings:

  - Added the required column `updated_at` to the `trip` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `trip` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "trip" ADD COLUMN     "car_display_name_snapshot" TEXT,
ADD COLUMN     "car_plate_snapshot" TEXT,
ADD COLUMN     "charged_km" DOUBLE PRECISION,
ADD COLUMN     "charged_minutes" DOUBLE PRECISION,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "distance_meters" DOUBLE PRECISION,
ADD COLUMN     "finish_lat" DECIMAL(9,6),
ADD COLUMN     "finish_lng" DECIMAL(9,6),
ADD COLUMN     "pause_started_at" TIMESTAMP(3),
ADD COLUMN     "price_distance" DECIMAL(19,2),
ADD COLUMN     "price_pause" DECIMAL(19,2),
ADD COLUMN     "price_time" DECIMAL(19,2),
ADD COLUMN     "price_total" DECIMAL(19,2),
ADD COLUMN     "start_lat" DECIMAL(9,6),
ADD COLUMN     "start_lon" DECIMAL(9,6),
ADD COLUMN     "tariff_version_id" UUID,
ADD COLUMN     "total_paused_sec" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "trip_tariff_version_id_idx" ON "trip"("tariff_version_id");

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_tariff_version_id_fkey" FOREIGN KEY ("tariff_version_id") REFERENCES "geo_zone_version"("id") ON DELETE SET NULL ON UPDATE CASCADE;
