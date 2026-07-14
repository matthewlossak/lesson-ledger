-- AlterTable
ALTER TABLE "User" ADD COLUMN     "abn" TEXT,
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "billToAddress" TEXT,
ADD COLUMN     "billToName" TEXT,
ADD COLUMN     "bsb" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;
