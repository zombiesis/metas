-- Audit-#2 N12+N15: surface branchId on AuditLog/SecurityEvent/AnalyticsEvent
-- so multi-tenant dashboards filter by an equality check, not a UserBranch
-- join (which over-counted for users belonging to multiple branches).

-- SQLite path. Postgres uses the same DDL syntax for adding nullable columns.
ALTER TABLE "AuditLog" ADD COLUMN "branchId" TEXT;
ALTER TABLE "SecurityEvent" ADD COLUMN "branchId" TEXT;
ALTER TABLE "AnalyticsEvent" ADD COLUMN "branchId" TEXT;

CREATE INDEX "AuditLog_branchId_createdAt_idx" ON "AuditLog"("branchId", "createdAt");
CREATE INDEX "SecurityEvent_branchId_createdAt_idx" ON "SecurityEvent"("branchId", "createdAt");
CREATE INDEX "AnalyticsEvent_branchId_createdAt_idx" ON "AnalyticsEvent"("branchId", "createdAt");
