/*
  Warnings:

  - You are about to drop the column `tariff_id` on the `trip` table. All the data in the column will be lost.
  - Made the column `tariff_version_id` on table `trip` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "trip" DROP CONSTRAINT "trip_tariff_id_fkey";

-- DropForeignKey
ALTER TABLE "trip" DROP CONSTRAINT "trip_tariff_version_id_fkey";

-- DropIndex
DROP INDEX "trip_tariff_id_idx";

-- AlterTable
ALTER TABLE "trip" DROP COLUMN "tariff_id",
ALTER COLUMN "tariff_version_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_tariff_version_id_fkey" FOREIGN KEY ("tariff_version_id") REFERENCES "geo_zone_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
