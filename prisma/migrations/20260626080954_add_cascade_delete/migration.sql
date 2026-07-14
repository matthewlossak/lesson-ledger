-- DropForeignKey
ALTER TABLE "SessionStudent" DROP CONSTRAINT "SessionStudent_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "SessionStudent" DROP CONSTRAINT "SessionStudent_studentId_fkey";

-- AddForeignKey
ALTER TABLE "SessionStudent" ADD CONSTRAINT "SessionStudent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionStudent" ADD CONSTRAINT "SessionStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
