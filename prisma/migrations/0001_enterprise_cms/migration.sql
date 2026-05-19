-- Initial enterprise CMS schema for SQLite development.
-- For PostgreSQL production, keep prisma/schema.prisma as source of truth and run prisma migrate deploy against a PostgreSQL DATABASE_URL.

CREATE TABLE IF NOT EXISTS "Role" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "description" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_key" ON "Role"("name");

CREATE TABLE IF NOT EXISTS "Permission" ("id" TEXT NOT NULL PRIMARY KEY, "key" TEXT NOT NULL, "description" TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS "Permission_key_key" ON "Permission"("key");

CREATE TABLE IF NOT EXISTS "RolePermission" ("id" TEXT NOT NULL PRIMARY KEY, "roleId" TEXT NOT NULL, "permissionId" TEXT NOT NULL, CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL PRIMARY KEY, "username" TEXT NOT NULL, "email" TEXT, "name" TEXT, "passwordHash" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'active', "roleId" TEXT, "lastLoginAt" DATETIME, "failedLogins" INTEGER NOT NULL DEFAULT 0, "lockedUntil" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE SET NULL ON UPDATE CASCADE);
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Session" ("id" TEXT NOT NULL PRIMARY KEY, "tokenHash" TEXT NOT NULL, "userId" TEXT NOT NULL, "ipAddress" TEXT, "userAgent" TEXT, "expiresAt" DATETIME NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE UNIQUE INDEX IF NOT EXISTS "Session_tokenHash_key" ON "Session"("tokenHash");

CREATE TABLE IF NOT EXISTS "AuditLog" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT, "action" TEXT NOT NULL, "entityType" TEXT NOT NULL, "entityId" TEXT, "summary" TEXT, "beforeValue" TEXT, "afterValue" TEXT, "ipAddress" TEXT, "userAgent" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE);

CREATE TABLE IF NOT EXISTS "Page" ("id" TEXT NOT NULL PRIMARY KEY, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "summary" TEXT, "body" TEXT, "status" TEXT NOT NULL DEFAULT 'published', "seoTitle" TEXT, "seoDescription" TEXT, "metadata" TEXT NOT NULL DEFAULT '{}', "createdBy" TEXT, "updatedBy" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS "Page_slug_key" ON "Page"("slug");

CREATE TABLE IF NOT EXISTS "PageVersion" ("id" TEXT NOT NULL PRIMARY KEY, "pageId" TEXT NOT NULL, "version" INTEGER NOT NULL, "snapshot" TEXT NOT NULL, "createdBy" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PageVersion_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE UNIQUE INDEX IF NOT EXISTS "PageVersion_pageId_version_key" ON "PageVersion"("pageId", "version");

CREATE TABLE IF NOT EXISTS "HomepageSection" ("id" TEXT NOT NULL PRIMARY KEY, "key" TEXT NOT NULL, "title" TEXT, "subtitle" TEXT, "body" TEXT, "order" INTEGER NOT NULL DEFAULT 0, "visible" BOOLEAN NOT NULL DEFAULT true, "status" TEXT NOT NULL DEFAULT 'published', "settings" TEXT NOT NULL DEFAULT '{}', "createdBy" TEXT, "updatedBy" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS "HomepageSection_key_key" ON "HomepageSection"("key");

CREATE TABLE IF NOT EXISTS "Program" ("id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "slug" TEXT NOT NULL, "category" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'draft', "duration" TEXT, "eligibility" TEXT, "summary" TEXT, "overview" TEXT, "authorityNote" TEXT, "admissionProcess" TEXT, "attendanceRules" TEXT, "semesterStructure" TEXT, "careerOpportunities" TEXT, "faqs" TEXT NOT NULL DEFAULT '[]', "rules" TEXT NOT NULL DEFAULT '[]', "documents" TEXT NOT NULL DEFAULT '[]', "facultyIds" TEXT NOT NULL DEFAULT '[]', "image" TEXT, "seoTitle" TEXT, "seoDescription" TEXT, "createdBy" TEXT, "updatedBy" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS "Program_slug_key" ON "Program"("slug");

CREATE TABLE IF NOT EXISTS "Faculty" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "photo" TEXT, "designation" TEXT, "department" TEXT, "qualification" TEXT, "experience" TEXT, "expertise" TEXT, "bio" TEXT, "publications" TEXT NOT NULL DEFAULT '[]', "contactEmail" TEXT, "contactPhone" TEXT, "contactVisible" BOOLEAN NOT NULL DEFAULT false, "spotlight" BOOLEAN NOT NULL DEFAULT false, "status" TEXT NOT NULL DEFAULT 'published', "createdBy" TEXT, "updatedBy" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS "Faculty_slug_key" ON "Faculty"("slug");

CREATE TABLE IF NOT EXISTS "Notice" ("id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "slug" TEXT NOT NULL, "category" TEXT NOT NULL, "date" DATETIME, "expiryDate" DATETIME, "status" TEXT NOT NULL DEFAULT 'active', "program" TEXT, "documentUrl" TEXT, "externalUrl" TEXT, "pinned" BOOLEAN NOT NULL DEFAULT false, "body" TEXT, "createdBy" TEXT, "updatedBy" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS "Notice_slug_key" ON "Notice"("slug");

CREATE TABLE IF NOT EXISTS "Document" ("id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "slug" TEXT NOT NULL, "category" TEXT, "authority" TEXT NOT NULL, "documentType" TEXT NOT NULL, "year" TEXT, "academicYear" TEXT, "program" TEXT, "description" TEXT, "tags" TEXT NOT NULL DEFAULT '[]', "status" TEXT NOT NULL DEFAULT 'current', "visibility" TEXT NOT NULL DEFAULT 'public', "fileUrl" TEXT NOT NULL, "fileSize" INTEGER, "version" INTEGER NOT NULL DEFAULT 1, "replacedById" TEXT, "downloadCount" INTEGER NOT NULL DEFAULT 0, "viewCount" INTEGER NOT NULL DEFAULT 0, "createdBy" TEXT, "updatedBy" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS "Document_slug_key" ON "Document"("slug");

CREATE TABLE IF NOT EXISTS "MediaAsset" ("id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "fileName" TEXT NOT NULL, "url" TEXT NOT NULL, "mimeType" TEXT, "size" INTEGER, "folder" TEXT, "altText" TEXT, "caption" TEXT, "tags" TEXT NOT NULL DEFAULT '[]', "usageCount" INTEGER NOT NULL DEFAULT 0, "status" TEXT NOT NULL DEFAULT 'active', "createdBy" TEXT, "updatedBy" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_url_key" ON "MediaAsset"("url");

CREATE TABLE IF NOT EXISTS "Event" ("id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "slug" TEXT NOT NULL, "category" TEXT, "summary" TEXT, "body" TEXT, "startDate" DATETIME, "endDate" DATETIME, "status" TEXT NOT NULL DEFAULT 'draft', "image" TEXT, "seoTitle" TEXT, "seoDescription" TEXT, "createdBy" TEXT, "updatedBy" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS "Event_slug_key" ON "Event"("slug");

CREATE TABLE IF NOT EXISTS "BlogPost" ("id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "slug" TEXT NOT NULL, "summary" TEXT, "body" TEXT, "status" TEXT NOT NULL DEFAULT 'draft', "image" TEXT, "publishedAt" DATETIME, "seoTitle" TEXT, "seoDescription" TEXT, "createdBy" TEXT, "updatedBy" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_key" ON "BlogPost"("slug");

CREATE TABLE IF NOT EXISTS "JobOpening" ("id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "slug" TEXT NOT NULL, "department" TEXT, "employmentType" TEXT, "deadline" DATETIME, "status" TEXT NOT NULL DEFAULT 'draft', "description" TEXT, "eligibility" TEXT, "noticeUrl" TEXT, "applicationUrl" TEXT, "createdBy" TEXT, "updatedBy" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS "JobOpening_slug_key" ON "JobOpening"("slug");

CREATE TABLE IF NOT EXISTS "FormSubmission" ("id" TEXT NOT NULL PRIMARY KEY, "kind" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'new', "name" TEXT, "phone" TEXT, "email" TEXT, "program" TEXT, "message" TEXT, "data" TEXT NOT NULL DEFAULT '{}', "sourcePage" TEXT, "utmSource" TEXT, "ipAddress" TEXT, "userAgent" TEXT, "spamScore" INTEGER NOT NULL DEFAULT 0, "assignedTo" TEXT, "notes" TEXT, "consent" BOOLEAN NOT NULL DEFAULT false, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
CREATE TABLE IF NOT EXISTS "AdmissionLead" ("id" TEXT NOT NULL PRIMARY KEY, "studentName" TEXT NOT NULL, "parentName" TEXT, "phone" TEXT NOT NULL, "whatsapp" TEXT, "email" TEXT, "city" TEXT, "program" TEXT, "qualification" TEXT, "message" TEXT, "sourcePage" TEXT, "utmSource" TEXT, "status" TEXT NOT NULL DEFAULT 'new', "assignedTo" TEXT, "notes" TEXT, "followUpAt" DATETIME, "duplicateOf" TEXT, "consent" BOOLEAN NOT NULL DEFAULT false, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
CREATE TABLE IF NOT EXISTS "RecruiterInquiry" ("id" TEXT NOT NULL PRIMARY KEY, "company" TEXT NOT NULL, "contactPerson" TEXT, "designation" TEXT, "phone" TEXT, "email" TEXT, "hiringRequirement" TEXT, "programInterest" TEXT, "message" TEXT, "status" TEXT NOT NULL DEFAULT 'new', "consent" BOOLEAN NOT NULL DEFAULT false, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
CREATE TABLE IF NOT EXISTS "AlumniRegistration" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "graduationYear" TEXT, "program" TEXT, "profession" TEXT, "company" TEXT, "phone" TEXT, "email" TEXT, "linkedIn" TEXT, "message" TEXT, "status" TEXT NOT NULL DEFAULT 'new', "consent" BOOLEAN NOT NULL DEFAULT false, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
CREATE TABLE IF NOT EXISTS "ContactInquiry" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "phone" TEXT, "email" TEXT, "inquiryType" TEXT NOT NULL, "message" TEXT, "status" TEXT NOT NULL DEFAULT 'new', "consent" BOOLEAN NOT NULL DEFAULT false, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
CREATE TABLE IF NOT EXISTS "SiteSetting" ("id" TEXT NOT NULL PRIMARY KEY, "key" TEXT NOT NULL, "value" TEXT NOT NULL, "label" TEXT, "group" TEXT, "updatedBy" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS "SiteSetting_key_key" ON "SiteSetting"("key");
CREATE TABLE IF NOT EXISTS "AnalyticsEvent" ("id" TEXT NOT NULL PRIMARY KEY, "event" TEXT NOT NULL, "path" TEXT, "label" TEXT, "value" TEXT, "metadata" TEXT NOT NULL DEFAULT '{}', "sessionId" TEXT, "ipAddress" TEXT, "userAgent" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS "SecurityEvent" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT, "event" TEXT NOT NULL, "severity" TEXT NOT NULL DEFAULT 'info', "summary" TEXT, "ipAddress" TEXT, "userAgent" TEXT, "metadata" TEXT NOT NULL DEFAULT '{}', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE);
