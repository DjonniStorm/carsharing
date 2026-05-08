-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- PostGIS: тип geometry(MultiPolygon,4326) в `geo_zone_version`
CREATE EXTENSION IF NOT EXISTS postgis;

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
CREATE TABLE "car_session" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "car_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car" (
    "id" UUID NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "license_plate" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "mileage" DOUBLE PRECISION NOT NULL,
    "fuel_level" DOUBLE PRECISION NOT NULL,
    "is_available" BOOLEAN NOT NULL,
    "car_status_id" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT,
    "last_known_lat" DOUBLE PRECISION,
    "last_known_lon" DOUBLE PRECISION,
    "last_position_at" TEXT,

    CONSTRAINT "car_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_session_info" (
    "id" SERIAL NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "start_lat" DECIMAL(9,6),
    "start_lon" DECIMAL(9,6),

    CONSTRAINT "car_session_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_zone" (
    "id" UUID NOT NULL,
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
    "id" UUID NOT NULL,
    "geozone_id" UUID NOT NULL,
    "geometry" geometry(MultiPolygon,4326) NOT NULL,
    "rules" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabled_at" TIMESTAMP(3),

    CONSTRAINT "geo_zone_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariff" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price_per_minute" DECIMAL(19,2) NOT NULL,
    "price_per_km" DECIMAL(19,2) NOT NULL,
    "geo_zone_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

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
    "car_id" UUID NOT NULL,
    "tariff_id" UUID NOT NULL,

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
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_key" ON "user"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "car_license_plate_key" ON "car"("license_plate");

-- CreateIndex
CREATE UNIQUE INDEX "car_session_info_trip_id_key" ON "car_session_info"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "geo_zone_current_version_id_key" ON "geo_zone"("current_version_id");

-- CreateIndex
CREATE INDEX "geo_zone_version_geozone_id_idx" ON "geo_zone_version"("geozone_id");

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
ALTER TABLE "car_session_info" ADD CONSTRAINT "car_session_info_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_zone" ADD CONSTRAINT "geo_zone_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_zone" ADD CONSTRAINT "geo_zone_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "geo_zone_version"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_zone_version" ADD CONSTRAINT "geo_zone_version_geozone_id_fkey" FOREIGN KEY ("geozone_id") REFERENCES "geo_zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
