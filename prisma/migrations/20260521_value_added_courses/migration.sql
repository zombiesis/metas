-- Audit-#2 N20: promote value-added-courses from JSON-only to a real model
-- so admin edits made through /api/admin/cms/value-added-courses actually
-- show up on the public /academics/value-added page.
CREATE TABLE "ValueAddedCourse" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "branchId" TEXT,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'Value-Added Course',
  "duration" TEXT,
  "eligibility" TEXT,
  "summary" TEXT,
  "image" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "deletedAt" DATETIME
);
CREATE INDEX "ValueAddedCourse_branchId_idx" ON "ValueAddedCourse"("branchId");
CREATE UNIQUE INDEX "ValueAddedCourse_slug_branchId_key" ON "ValueAddedCourse"("slug", "branchId");
