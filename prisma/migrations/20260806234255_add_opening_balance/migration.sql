-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "openingAccumulatedDepreciation" DECIMAL(14,2),
ADD COLUMN     "openingAsOfDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DepreciationEntry" ADD COLUMN     "isOpeningBalance" BOOLEAN NOT NULL DEFAULT false;
