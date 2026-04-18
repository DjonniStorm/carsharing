/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- PostGIS: тип `geometry(Polygon,4326)` в `geo_zone.polygon` существует только с этим расширением.
CREATE EXTENSION IF NOT EXISTS postgis;

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "hash_password" TEXT NOT NULL,
    "role" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_status" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "car_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_session" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "car_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car" (
    "id" SERIAL NOT NULL,
    "mileage" DOUBLE PRECISION NOT NULL,
    "fuel_level" DOUBLE PRECISION NOT NULL,
    "is_available" BOOLEAN NOT NULL,
    "car_status_id" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL,

    CONSTRAINT "car_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_session_info" (
    "id" SERIAL NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "license_plate" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "car_id" INTEGER NOT NULL,
    "current_lat" DECIMAL(9,6) NOT NULL,
    "current_lon" DECIMAL(9,6) NOT NULL,

    CONSTRAINT "car_session_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_zone" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "polygon" geometry(Polygon,4326) NOT NULL,

    CONSTRAINT "geo_zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariff" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price_per_minute" DECIMAL(10,2) NOT NULL,
    "price_per_km" DECIMAL(10,2) NOT NULL,
    "geo_zone_id" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL,

    CONSTRAINT "tariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip" (
    "id" SERIAL NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "distance" DOUBLE PRECISION NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "user_id" UUID NOT NULL,
    "car_id" INTEGER NOT NULL,
    "tariff_id" INTEGER NOT NULL,

    CONSTRAINT "trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "lat" DECIMAL(9,6) NOT NULL,
    "lon" DECIMAL(9,6) NOT NULL,
    "speed" DECIMAL(5,2) NOT NULL,
    "acceleration" DOUBLE PRECISION NOT NULL,
    "fuel_level" DOUBLE PRECISION NOT NULL,
    "trip_id" INTEGER NOT NULL,

    CONSTRAINT "telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violation" (
    "id" SERIAL NOT NULL,
    "type" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trip_id" INTEGER NOT NULL,

    CONSTRAINT "violation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violation_notification" (
    "violation_id" INTEGER NOT NULL,
    "notification_id" INTEGER NOT NULL,

    CONSTRAINT "violation_notification_pkey" PRIMARY KEY ("violation_id","notification_id")
);

-- CreateIndex
CREATE INDEX "user_email_idx" ON "user"("email");

-- CreateIndex
CREATE INDEX "car_car_status_id_idx" ON "car"("car_status_id");

-- CreateIndex
CREATE UNIQUE INDEX "car_session_info_car_id_key" ON "car_session_info"("car_id");

-- CreateIndex
CREATE INDEX "tariff_geo_zone_id_idx" ON "tariff"("geo_zone_id");

-- CreateIndex
CREATE INDEX "trip_user_id_idx" ON "trip"("user_id");

-- CreateIndex
CREATE INDEX "trip_car_id_idx" ON "trip"("car_id");

-- CreateIndex
CREATE INDEX "trip_tariff_id_idx" ON "trip"("tariff_id");

-- CreateIndex
CREATE INDEX "telemetry_trip_id_idx" ON "telemetry"("trip_id");

-- CreateIndex
CREATE INDEX "telemetry_timestamp_idx" ON "telemetry"("timestamp");

-- CreateIndex
CREATE INDEX "violation_trip_id_idx" ON "violation"("trip_id");

-- CreateIndex
CREATE INDEX "notification_user_id_idx" ON "notification"("user_id");

-- AddForeignKey
ALTER TABLE "car" ADD CONSTRAINT "car_car_status_id_fkey" FOREIGN KEY ("car_status_id") REFERENCES "car_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_session_info" ADD CONSTRAINT "car_session_info_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariff" ADD CONSTRAINT "tariff_geo_zone_id_fkey" FOREIGN KEY ("geo_zone_id") REFERENCES "geo_zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_tariff_id_fkey" FOREIGN KEY ("tariff_id") REFERENCES "tariff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry" ADD CONSTRAINT "telemetry_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violation" ADD CONSTRAINT "violation_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violation_notification" ADD CONSTRAINT "violation_notification_violation_id_fkey" FOREIGN KEY ("violation_id") REFERENCES "violation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violation_notification" ADD CONSTRAINT "violation_notification_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
