/*
  Warnings:

  - The primary key for the `telemetry` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `speed` on the `telemetry` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - The primary key for the `trip` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `trip_id` on the `car_session_info` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `telemetry` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `trip_id` on the `telemetry` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `trip` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `trip_id` on the `violation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "car_session_info" DROP CONSTRAINT "car_session_info_trip_id_fkey";

-- DropForeignKey
ALTER TABLE "telemetry" DROP CONSTRAINT "telemetry_trip_id_fkey";

-- DropForeignKey
ALTER TABLE "violation" DROP CONSTRAINT "violation_trip_id_fkey";

-- AlterTable
ALTER TABLE "car_session_info" DROP COLUMN "trip_id",
ADD COLUMN     "trip_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "telemetry" DROP CONSTRAINT "telemetry_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "speed" SET DATA TYPE DOUBLE PRECISION,
DROP COLUMN "trip_id",
ADD COLUMN     "trip_id" UUID NOT NULL,
ADD CONSTRAINT "telemetry_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "trip" DROP CONSTRAINT "trip_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "trip_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "violation" DROP COLUMN "trip_id",
ADD COLUMN     "trip_id" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "car_session_info_trip_id_key" ON "car_session_info"("trip_id");

-- CreateIndex
CREATE INDEX "telemetry_trip_id_idx" ON "telemetry"("trip_id");

-- CreateIndex
CREATE INDEX "violation_trip_id_idx" ON "violation"("trip_id");

-- AddForeignKey
ALTER TABLE "car_session_info" ADD CONSTRAINT "car_session_info_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry" ADD CONSTRAINT "telemetry_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violation" ADD CONSTRAINT "violation_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
