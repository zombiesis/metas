-- AddColumn
ALTER TABLE "Page" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';

-- AddColumn
ALTER TABLE "Program" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';

-- AddColumn
ALTER TABLE "Notice" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';
