import { z } from "zod";
import { JOB_CATEGORIES } from "@/lib/jobCategories";
import {
  VALID_JOB_TYPES,
  VALID_APPLICATION_STATUSES,
  ADMIN_MANAGEABLE_JOB_STATUSES,
  EXPERIENCE_LEVELS,
  COMPANY_SIZES,
} from "@/lib/constants";



const noHtml = (v: string) => !/[<>]/.test(v);
const noHtmlMessage = "Must not contain < or > characters";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .refine(noHtml, { message: noHtmlMessage }),
  email: z.string().trim().toLowerCase().email(),
  // min 8 for production; requires at least one letter and one number for basic strength
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200)
    .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), {
      message: "Password must contain at least one letter and one number",
    }),
  role: z.enum(["student", "company"]),
});

export const jobCreateSchema = z.object({
  title: z.string().trim().min(3).max(150).refine(noHtml, { message: noHtmlMessage }),
  description: z.string().trim().min(20).max(10000).refine(noHtml, { message: noHtmlMessage }),
  category: z.enum(JOB_CATEGORIES as unknown as [string, ...string[]]),
  location: z.string().trim().min(1).max(150).refine(noHtml, { message: noHtmlMessage }),
  salaryRange: z.string().trim().max(100).refine(noHtml, { message: noHtmlMessage }).optional().default(""),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  jobType: z.enum(VALID_JOB_TYPES as unknown as [string, ...string[]]),
  experienceLevel: z.enum(EXPERIENCE_LEVELS as unknown as [string, ...string[]]).optional(),
  isRemote: z.boolean().optional().default(false),
  deadline: z
    .string()
    .refine((v) => !Number.isNaN(new Date(v).getTime()), { message: "Invalid deadline date" })
    .refine((v) => new Date(v).getTime() > Date.now(), { message: "Deadline must be a future date" }),
});

export const jobUpdateSchema = z
  .object({
    title: z.string().trim().min(3).max(150).refine(noHtml, { message: noHtmlMessage }).optional(),
    description: z.string().trim().min(20).max(10000).refine(noHtml, { message: noHtmlMessage }).optional(),
    category: z.enum(JOB_CATEGORIES as unknown as [string, ...string[]]).optional(),
    location: z.string().trim().min(1).max(150).refine(noHtml, { message: noHtmlMessage }).optional(),
    salaryRange: z.string().trim().max(100).refine(noHtml, { message: noHtmlMessage }).optional(),
    salaryMin: z.number().min(0).optional(),
    salaryMax: z.number().min(0).optional(),
    jobType: z.enum(VALID_JOB_TYPES as unknown as [string, ...string[]]).optional(),
    experienceLevel: z.enum(EXPERIENCE_LEVELS as unknown as [string, ...string[]]).optional(),
    isRemote: z.boolean().optional(),
    deadline: z
      .string()
      .refine((v) => !Number.isNaN(new Date(v).getTime()), { message: "Invalid deadline date" })
      .refine((v) => new Date(v).getTime() > Date.now(), { message: "Deadline must be a future date" })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update",
  });

export const applicationCreateSchema = z.object({
  jobId: z.string().min(1),
  resumeUrl: z.string().url().refine((url) => url.startsWith("https://"), {
    message: "resumeUrl must be https",
  }),
  coverLetter: z.string().max(5000).refine(noHtml, { message: noHtmlMessage }).optional().default(""),
});

export const applicationStatusSchema = z.object({
  status: z.enum(VALID_APPLICATION_STATUSES as unknown as [string, ...string[]]),
});

export const adminJobStatusSchema = z.object({
  status: z.enum(ADMIN_MANAGEABLE_JOB_STATUSES as unknown as [string, ...string[]]),
});

export const studentProfilePatchSchema = z.object({
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[\d+\-\s()]*$/, "Invalid phone format")
    .optional(),
  bio: z.string().trim().max(2000).refine(noHtml, { message: noHtmlMessage }).optional(),
  skills: z
    .array(z.string().trim().min(1).max(50).refine(noHtml, { message: noHtmlMessage }))
    .max(50)
    .optional(),
  resumeUrl: z.string().url().optional().or(z.literal("")),
});

export const companyProfilePatchSchema = z.object({
  companyName: z.string().trim().min(2).max(150).refine(noHtml, { message: noHtmlMessage }).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  website: z
    .string()
    .trim()
    .max(300)
    .optional()
    .refine((v) => !v || /^https?:\/\/.+/.test(v), { message: "Website must start with http:// or https://" }),
  description: z.string().trim().max(5000).refine(noHtml, { message: noHtmlMessage }).optional(),
  industry: z.string().trim().max(100).refine(noHtml, { message: noHtmlMessage }).optional(),
  size: z.enum([...COMPANY_SIZES, ""] as unknown as [string, ...string[]]).optional(),
  foundedYear: z.number().min(1800).max(2100).optional(),
  location: z.string().trim().max(150).refine(noHtml, { message: noHtmlMessage }).optional(),
});

export const bookmarkSchema = z.object({
  jobId: z.string().min(1),
});

export function formatZodError(err: z.ZodError) {
  return err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}
