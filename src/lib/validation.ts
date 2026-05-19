import { z } from 'zod';

export const userSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().optional().or(z.literal('')),
  name: z.string().max(100).optional(),
  password: z.string().min(12).optional(),
  roleName: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export const pageSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  summary: z.string().max(500).optional(),
  body: z.string().optional().default(''),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});

export const programSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  duration: z.string().max(100).optional(),
  eligibility: z.string().optional(),
  summary: z.string().max(500).optional(),
  overview: z.string().optional(),
  authorityNote: z.string().optional(),
  admissionProcess: z.string().optional(),
  attendanceRules: z.string().optional(),
  semesterStructure: z.string().optional(),
  careerOpportunities: z.string().optional(),
  rules: z.union([z.array(z.string()), z.string()]).optional(),
  documents: z.union([z.array(z.string()), z.string()]).optional(),
  faqs: z.union([z.array(z.string()), z.string()]).optional(),
  facultyIds: z.union([z.array(z.string()), z.string()]).optional(),
  image: z.string().url().optional().or(z.literal('')),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});

export const noticeSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  date: z.string().optional(),
  expiryDate: z.string().optional(),
  status: z.enum(['active', 'expired', 'draft']).optional(),
  program: z.string().optional(),
  url: z.string().optional(),
  documentUrl: z.string().optional(),
  pinned: z.boolean().optional(),
  body: z.string().optional(),
});

export const documentSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  category: z.string().optional(),
  authority: z.string().optional(),
  documentType: z.string().optional(),
  year: z.string().optional(),
  academicYear: z.string().optional(),
  program: z.string().optional(),
  description: z.string().optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  status: z.string().optional(),
  visibility: z.enum(['public', 'internal', 'restricted']).optional(),
  file: z.string().optional(),
  fileUrl: z.string().optional(),
});

export const facultySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().max(200).optional(),
  photo: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.string().optional(),
  expertise: z.string().optional(),
  bio: z.string().optional(),
  publications: z.union([z.array(z.string()), z.string()]).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  contactVisible: z.boolean().optional(),
  spotlight: z.boolean().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

const schemas: Record<string, z.ZodType> = {
  users: userSchema,
  pages: pageSchema,
  programs: programSchema,
  notices: noticeSchema,
  documents: documentSchema,
  faculty: facultySchema,
};

/** Validate input data for a collection. Returns parsed data or throws. */
export function validateInput(collection: string, data: unknown): unknown {
  const schema = schemas[collection];
  if (!schema) return data; // collections without schemas pass through
  return schema.parse(data);
}
