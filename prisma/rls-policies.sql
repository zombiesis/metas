-- PostgreSQL Row-Level Security (RLS) Policies for Multi-Tenant Isolation
-- Run AFTER migrations, with a superuser connection.
-- These are defense-in-depth — the application already filters by branchId.

-- 1. Enable RLS on all content tables
ALTER TABLE "Page" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HomepageSection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Program" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Faculty" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JobOpening" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdmissionLead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecruiterInquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AlumniRegistration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContactInquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SiteSetting" ENABLE ROW LEVEL SECURITY;

-- 2. Create policies: app user can only access rows matching current_setting('app.branch_id')
-- The application sets this via: SET LOCAL app.branch_id = '<branchId>';

CREATE POLICY tenant_isolation_page ON "Page"
  USING ("branchId" = current_setting('app.branch_id', true) OR current_setting('app.branch_id', true) = '');

CREATE POLICY tenant_isolation_homepage ON "HomepageSection"
  USING ("branchId" = current_setting('app.branch_id', true) OR current_setting('app.branch_id', true) = '');

CREATE POLICY tenant_isolation_program ON "Program"
  USING ("branchId" = current_setting('app.branch_id', true) OR current_setting('app.branch_id', true) = '');

CREATE POLICY tenant_isolation_faculty ON "Faculty"
  USING ("branchId" = current_setting('app.branch_id', true) OR current_setting('app.branch_id', true) = '');

CREATE POLICY tenant_isolation_notice ON "Notice"
  USING ("branchId" = current_setting('app.branch_id', true) OR current_setting('app.branch_id', true) = '');

CREATE POLICY tenant_isolation_document ON "Document"
  USING ("branchId" = current_setting('app.branch_id', true) OR current_setting('app.branch_id', true) = '');

CREATE POLICY tenant_isolation_media ON "MediaAsset"
  USING ("branchId" = current_setting('app.branch_id', true) OR current_setting('app.branch_id', true) = '');

CREATE POLICY tenant_isolation_event ON "Event"
  USING ("branchId" = current_setting('app.branch_id', true) OR current_setting('app.branch_id', true) = '');

CREATE POLICY tenant_isolation_blog ON "BlogPost"
  USING ("branchId" = current_setting('app.branch_id', true) OR current_setting('app.branch_id', true) = '');

CREATE POLICY tenant_isolation_job ON "JobOpening"
  USING ("branchId" = current_setting('app.branch_id', true) OR current_setting('app.branch_id', true) = '');

CREATE POLICY tenant_isolation_form ON "FormSubmission"
  USING ("branchId" = current_setting('app.branch_id', true) OR current_setting('app.branch_id', true) = '');

CREATE POLICY tenant_isolation_admission ON "AdmissionLead"
  USING ("branchId" = current_setting('app.branch_id', true) OR current_setting('app.branch_id', true) = '');

CREATE POLICY tenant_isolation_recruiter ON "RecruiterInquiry"
  USING ("branchId" = current_setting('app.branch_id', true) OR current_setting('app.branch_id', true) = '');

CREATE POLICY tenant_isolation_alumni ON "AlumniRegistration"
  USING ("branchId" = current_setting('app.branch_id', true) OR current_setting('app.branch_id', true) = '');

CREATE POLICY tenant_isolation_contact ON "ContactInquiry"
  USING ("branchId" = current_setting('app.branch_id', true) OR current_setting('app.branch_id', true) = '');

CREATE POLICY tenant_isolation_setting ON "SiteSetting"
  USING ("branchId" = current_setting('app.branch_id', true) OR current_setting('app.branch_id', true) = '');

-- 3. Grant usage to the application database user
-- Replace 'metas_app' with your actual DB user
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO metas_app;

-- NOTE: The application must execute SET LOCAL app.branch_id = '<id>' at the start
-- of each request/transaction for RLS to take effect. When app.branch_id is empty
-- string or not set, the OR clause allows access (for migrations/super admin).
