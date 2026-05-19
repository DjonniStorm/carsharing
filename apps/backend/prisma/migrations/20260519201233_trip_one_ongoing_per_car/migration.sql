/*
  Warnings:

  - A unique constraint covering the columns `[car_id]` on the table `trip` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "trip_one_ongoing_per_car_idx" ON "trip"("car_id") WHERE (status IN (0, 1, 2, 3));
