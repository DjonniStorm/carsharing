/*
  Warnings:

  - The primary key for the `violation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `violation_notification` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `violation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `violation_id` on the `violation_notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "violation_notification" DROP CONSTRAINT "violation_notification_violation_id_fkey";

-- AlterTable
ALTER TABLE "violation" DROP CONSTRAINT "violation_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "violation_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "violation_notification" DROP CONSTRAINT "violation_notification_pkey",
DROP COLUMN "violation_id",
ADD COLUMN     "violation_id" UUID NOT NULL,
ADD CONSTRAINT "violation_notification_pkey" PRIMARY KEY ("violation_id", "notification_id");

-- AddForeignKey
ALTER TABLE "violation_notification" ADD CONSTRAINT "violation_notification_violation_id_fkey" FOREIGN KEY ("violation_id") REFERENCES "violation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
