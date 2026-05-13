-- AlterTable
ALTER TABLE "notification" ADD COLUMN "trip_id" UUID;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "notification_trip_id_idx" ON "notification"("trip_id");
