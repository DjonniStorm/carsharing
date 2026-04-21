-- AlterTable
ALTER TABLE "geo_zone_version" ADD COLUMN     "pause_price_per_minute" DECIMAL(19,2) NOT NULL DEFAULT 0,
ADD COLUMN     "price_per_km" DECIMAL(19,2) NOT NULL DEFAULT 0,
ADD COLUMN     "price_per_minute" DECIMAL(19,2) NOT NULL DEFAULT 0;
