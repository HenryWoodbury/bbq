/*
  Warnings:

  - Made the column `season` on table `player_map_imports` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "player_map_imports" ALTER COLUMN "season" SET NOT NULL;
