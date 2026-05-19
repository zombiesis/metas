import type { CMSCollection } from '@/lib/cms-db';

export type AdminField = {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'richtext' | 'select' | 'checkbox' | 'date' | 'number' | 'list' | 'email' | 'tel' | 'url' | 'readonly' | 'password';
  options?: string[];
  required?: boolean;
  placeholder?: string;
  help?: string;
};

export type AdminCollectionConfig = {
  collection: CMSCollection;
  title: string;
  description: string;
  singular: string;
  readonly?: boolean;
  fields: AdminField[];
};

const statusOptions = ['draft', 'published', 'active', 'current', 'archived', 'verification_required', 'active-until-cycle-close', 'placeholder', 'closed'];

export const ADMIN_COLLECTION_CONFIGS: Partial<Record<CMSCollection, AdminCollectionConfig>> = {
  pages: {
    collection: 'pages',
    title: 'Pages',
    singular: 'Page',
    description: 'Edit institutional pages with normal form fields and version history. Public pages can read these records dynamically.',
    fields: [
      { name: 'title', label: 'Page title', required: true },
      { name: 'slug', label: 'URL slug', required: true, help: 'Example: about or admissions' },
      { name: 'summary', label: 'Short summary', type: 'textarea' },
      { name: 'body', label: 'Page body', type: 'richtext' },
      { name: 'status', label: 'Status', type: 'select', options: statusOptions },
      { name: 'seoTitle', label: 'SEO title' },
      { name: 'seoDescription', label: 'SEO description', type: 'textarea' }
    ]
  },
  programs: {
    collection: 'programs',
    title: 'Program Manager',
    singular: 'Program',
    description: 'Manage MBA, BBA, GNM, and draft/placeholder programs without inventing missing data.',
    fields: [
      { name: 'title', label: 'Program name', required: true },
      { name: 'slug', label: 'Slug', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['Management', 'Nursing', 'Computer Applications', 'Commerce', 'Value-Added Course', 'Digital Learning'] },
      { name: 'status', label: 'Status', type: 'select', options: ['verified-active', 'published', 'draft', 'cms-placeholder-verified-approval-reference', 'cms-placeholder-verified-permission-reference', 'cms-placeholder-unverified', 'archived'] },
      { name: 'duration', label: 'Duration' },
      { name: 'eligibility', label: 'Eligibility', type: 'textarea' },
      { name: 'summary', label: 'Short overview', type: 'textarea' },
      { name: 'overview', label: 'Detailed overview', type: 'richtext' },
      { name: 'authorityNote', label: 'Authority / verification note', type: 'textarea' },
      { name: 'admissionProcess', label: 'Admission process', type: 'richtext' },
      { name: 'attendanceRules', label: 'Attendance rules', type: 'textarea' },
      { name: 'semesterStructure', label: 'Semester structure', type: 'textarea' },
      { name: 'careerOpportunities', label: 'Career opportunities', type: 'textarea' },
      { name: 'rules', label: 'Official rules, one per line', type: 'list' },
      { name: 'documents', label: 'Linked documents, one per line', type: 'list' },
      { name: 'faqs', label: 'FAQs, one per line for now', type: 'list' },
      { name: 'image', label: 'Image URL' },
      { name: 'seoTitle', label: 'SEO title' },
      { name: 'seoDescription', label: 'SEO description', type: 'textarea' }
    ]
  },
  notices: {
    collection: 'notices',
    title: 'Notice Manager',
    singular: 'Notice',
    description: 'Publish, pin, expire, and archive admissions, exam, result, job, and newsletter notices.',
    fields: [
      { name: 'title', label: 'Notice title', required: true },
      { name: 'slug', label: 'Slug' },
      { name: 'category', label: 'Category', type: 'select', options: ['Admissions', 'Exams', 'Results', 'Newsletters', 'Jobs', 'Placement Drives', 'General'] },
      { name: 'date', label: 'Publish date', type: 'date' },
      { name: 'expiryDate', label: 'Expiry date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'draft', 'current-newsletter', 'archive-after-cycle', 'active-until-cycle-close', 'archived'] },
      { name: 'program', label: 'Program' },
      { name: 'url', label: 'Document or external URL', type: 'url' },
      { name: 'pinned', label: 'Pin to homepage', type: 'checkbox' },
      { name: 'body', label: 'Notice description', type: 'richtext' }
    ]
  },
  documents: {
    collection: 'documents',
    title: 'Document Center',
    singular: 'Document',
    description: 'Manage searchable IQAC, NAAC, AICTE, GTU, VNSGU, GNC, placement, career, and syllabus documents.',
    fields: [
      { name: 'title', label: 'Document title', required: true },
      { name: 'slug', label: 'Slug' },
      { name: 'category', label: 'Category', type: 'select', options: ['approvals', 'iqac', 'notices', 'newsletters', 'placement', 'careers', 'syllabus', 'mandatory-disclosure'] },
      { name: 'authority', label: 'Authority', type: 'select', options: ['AICTE', 'GTU', 'VNSGU', 'GNC', 'NAAC', 'IQAC', 'Internal', 'AICTE / GTU / VNSGU / GNC', 'IQAC / NAAC / Internal', 'Internal / HR'] },
      { name: 'documentType', label: 'Document type' },
      { name: 'year', label: 'Year' },
      { name: 'academicYear', label: 'Academic year' },
      { name: 'program', label: 'Program' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'tags', label: 'Tags, one per line', type: 'list' },
      { name: 'status', label: 'Status', type: 'select', options: ['current', 'published', 'archived', 'verification_required', 'Downloaded from live site; admin verification before launch'] },
      { name: 'visibility', label: 'Visibility', type: 'select', options: ['public', 'private'] },
      { name: 'file', label: 'PDF/file URL', type: 'url', required: true }
    ]
  },
  faculty: {
    collection: 'faculty',
    title: 'Faculty Directory',
    singular: 'Faculty profile',
    description: 'Maintain verified faculty profiles. Do not invent qualifications, designations, or publications.',
    fields: [
      { name: 'name', label: 'Full name', required: true },
      { name: 'slug', label: 'Slug' },
      { name: 'photo', label: 'Photo URL' },
      { name: 'designation', label: 'Designation' },
      { name: 'department', label: 'Department', type: 'select', options: ['Management', 'MBA', 'BBA', 'Nursing', 'GNM', 'B.Sc Nursing', 'Administration', 'Support'] },
      { name: 'qualification', label: 'Qualification' },
      { name: 'experience', label: 'Experience' },
      { name: 'expertise', label: 'Expertise' },
      { name: 'bio', label: 'Bio', type: 'richtext' },
      { name: 'publications', label: 'Publications, one per line', type: 'list' },
      { name: 'contactEmail', label: 'Email', type: 'email' },
      { name: 'contactPhone', label: 'Phone', type: 'tel' },
      { name: 'contactVisible', label: 'Show contact publicly', type: 'checkbox' },
      { name: 'spotlight', label: 'Show in homepage spotlight', type: 'checkbox' },
      { name: 'status', label: 'Status', type: 'select', options: ['published', 'draft', 'archived'] }
    ]
  },
  media: {
    collection: 'media',
    title: 'Media Library',
    singular: 'Media asset',
    description: 'Upload, tag, describe, and safely replace images and PDFs. Alt text is required for meaningful images.',
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'url', label: 'File URL', type: 'url' },
      { name: 'fileName', label: 'File name' },
      { name: 'folder', label: 'Folder/category' },
      { name: 'mimeType', label: 'MIME type' },
      { name: 'altText', label: 'Alt text' },
      { name: 'caption', label: 'Caption', type: 'textarea' },
      { name: 'tags', label: 'Tags, one per line', type: 'list' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'archived'] }
    ]
  },
  forms: {
    collection: 'forms',
    title: 'Form Submissions',
    singular: 'Submission',
    description: 'View, assign, note, and export all non-admission form submissions.',
    fields: [
      { name: 'kind', label: 'Form type', type: 'readonly' },
      { name: 'status', label: 'Status', type: 'select', options: ['new', 'contacted', 'follow-up', 'converted', 'closed', 'spam'] },
      { name: 'name', label: 'Name' },
      { name: 'phone', label: 'Phone' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'program', label: 'Program' },
      { name: 'message', label: 'Message', type: 'textarea' },
      { name: 'assignedTo', label: 'Assigned to' },
      { name: 'notes', label: 'Staff notes', type: 'textarea' }
    ]
  },
  admissions: {
    collection: 'admissions',
    title: 'Admissions CRM-lite',
    singular: 'Admissions lead',
    description: 'Search, filter, follow up, and export admissions leads from the public site.',
    fields: [
      { name: 'studentName', label: 'Student name', required: true },
      { name: 'parentName', label: 'Parent name' },
      { name: 'phone', label: 'Phone', type: 'tel', required: true },
      { name: 'whatsapp', label: 'WhatsApp', type: 'tel' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'city', label: 'City' },
      { name: 'program', label: 'Program interest' },
      { name: 'qualification', label: 'Current qualification' },
      { name: 'message', label: 'Message', type: 'textarea' },
      { name: 'status', label: 'Lead status', type: 'select', options: ['new', 'contacted', 'follow-up', 'converted', 'closed'] },
      { name: 'assignedTo', label: 'Assigned to' },
      { name: 'followUpAt', label: 'Follow-up date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  recruiters: {
    collection: 'recruiters',
    title: 'Recruiter Inquiries',
    singular: 'Recruiter inquiry',
    description: 'Manage company inquiries for placements, internships, and campus drives.',
    fields: [
      { name: 'company', label: 'Company', required: true },
      { name: 'contactPerson', label: 'Contact person' },
      { name: 'designation', label: 'Designation' },
      { name: 'phone', label: 'Phone' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'hiringRequirement', label: 'Hiring requirement', type: 'textarea' },
      { name: 'programInterest', label: 'Program interest' },
      { name: 'message', label: 'Message', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['new', 'contacted', 'follow-up', 'closed'] }
    ]
  },
  alumni: {
    collection: 'alumni',
    title: 'Alumni Registrations',
    singular: 'Alumni registration',
    description: 'Manage alumni registration, network, and mentorship interest.',
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'graduationYear', label: 'Graduation year' },
      { name: 'program', label: 'Program' },
      { name: 'profession', label: 'Profession' },
      { name: 'company', label: 'Company' },
      { name: 'phone', label: 'Phone' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'linkedIn', label: 'LinkedIn', type: 'url' },
      { name: 'message', label: 'Message', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['new', 'approved', 'contacted', 'archived'] }
    ]
  },
  contacts: {
    collection: 'contacts',
    title: 'Contact Inquiries',
    singular: 'Contact inquiry',
    description: 'Department-routed contact inquiries.',
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'phone', label: 'Phone' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'inquiryType', label: 'Inquiry type', type: 'select', options: ['Admission', 'Placement', 'Faculty', 'Student', 'Alumni', 'Career', 'General'] },
      { name: 'message', label: 'Message', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['new', 'contacted', 'closed', 'spam'] }
    ]
  },
  events: {
    collection: 'events',
    title: 'Events',
    singular: 'Event',
    description: 'Manage current events and historical archive entries.',
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'slug', label: 'Slug' },
      { name: 'category', label: 'Category' },
      { name: 'summary', label: 'Summary', type: 'textarea' },
      { name: 'body', label: 'Body', type: 'richtext' },
      { name: 'startDate', label: 'Start date', type: 'date' },
      { name: 'endDate', label: 'End date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'upcoming', 'completed', 'archived'] },
      { name: 'image', label: 'Image URL' }
    ]
  },
  blogs: {
    collection: 'blogs',
    title: 'Blogs / News',
    singular: 'Blog post',
    description: 'Publish official news and blog entries only after content approval.',
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'slug', label: 'Slug' },
      { name: 'summary', label: 'Summary', type: 'textarea' },
      { name: 'body', label: 'Body', type: 'richtext' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published', 'archived'] },
      { name: 'image', label: 'Image URL' },
      { name: 'publishedAt', label: 'Publish date', type: 'date' },
      { name: 'seoTitle', label: 'SEO title' },
      { name: 'seoDescription', label: 'SEO description', type: 'textarea' }
    ]
  },
  careers: {
    collection: 'careers',
    title: 'Careers',
    singular: 'Job opening',
    description: 'Manage active, closed, and archived faculty/staff openings.',
    fields: [
      { name: 'title', label: 'Job title', required: true },
      { name: 'slug', label: 'Slug' },
      { name: 'department', label: 'Department' },
      { name: 'employmentType', label: 'Employment type' },
      { name: 'deadline', label: 'Deadline', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'active', 'closed', 'archived'] },
      { name: 'description', label: 'Description', type: 'richtext' },
      { name: 'eligibility', label: 'Eligibility', type: 'textarea' },
      { name: 'noticeUrl', label: 'Notice PDF URL', type: 'url' },
      { name: 'applicationUrl', label: 'Application form URL', type: 'url' }
    ]
  },
  users: {
    collection: 'users',
    title: 'Users',
    singular: 'Admin user',
    description: 'Manage admin accounts. Password field only changes password when filled.',
    fields: [
      { name: 'username', label: 'Username', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'name', label: 'Name' },
      { name: 'roleName', label: 'Role', type: 'select', options: ['Super Admin', 'Principal', 'Admissions Manager', 'Placement Officer', 'IQAC Coordinator', 'Faculty Editor', 'Media Editor', 'HR Manager', 'Viewer'] },
      { name: 'password', label: 'New password', type: 'password', help: 'Leave blank to keep the existing password.' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'disabled'] }
    ]
  },
  roles: {
    collection: 'roles',
    title: 'Roles',
    singular: 'Role',
    description: 'Review role definitions and permission groups. Super Admin should manage production permissions carefully.',
    fields: [
      { name: 'name', label: 'Role name', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'permissionKeys', label: 'Permissions, one per line', type: 'list' }
    ]
  },
  'audit-logs': {
    collection: 'audit-logs',
    title: 'Audit Logs',
    singular: 'Audit log',
    description: 'Read-only trail of important admin and content actions.',
    readonly: true,
    fields: [
      { name: 'createdAt', label: 'Timestamp', type: 'readonly' },
      { name: 'action', label: 'Action', type: 'readonly' },
      { name: 'entityType', label: 'Entity', type: 'readonly' },
      { name: 'summary', label: 'Summary', type: 'readonly' },
      { name: 'ipAddress', label: 'IP', type: 'readonly' }
    ]
  },
  'security-events': {
    collection: 'security-events',
    title: 'Security Events',
    singular: 'Security event',
    description: 'Login, rate-limit, file upload, and suspicious activity events.',
    readonly: true,
    fields: [
      { name: 'createdAt', label: 'Timestamp', type: 'readonly' },
      { name: 'event', label: 'Event', type: 'readonly' },
      { name: 'severity', label: 'Severity', type: 'readonly' },
      { name: 'summary', label: 'Summary', type: 'readonly' },
      { name: 'ipAddress', label: 'IP', type: 'readonly' }
    ]
  },
  'analytics-events': {
    collection: 'analytics-events',
    title: 'Analytics Events',
    singular: 'Analytics event',
    description: 'Raw analytics event stream used by the dashboard.',
    readonly: true,
    fields: [
      { name: 'createdAt', label: 'Timestamp', type: 'readonly' },
      { name: 'event', label: 'Event', type: 'readonly' },
      { name: 'path', label: 'Path', type: 'readonly' },
      { name: 'label', label: 'Label', type: 'readonly' },
      { name: 'value', label: 'Value', type: 'readonly' }
    ]
  }
};

export function getAdminCollectionConfig(collection: CMSCollection) {
  return ADMIN_COLLECTION_CONFIGS[collection];
}
