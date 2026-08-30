// Centralized constants — single source of truth for enums used across API routes + UI
export const VALID_JOB_TYPES = ["full-time", "part-time", "internship"] as const;
export type JobType = (typeof VALID_JOB_TYPES)[number];

export const VALID_JOB_STATUSES = ["pending", "approved", "rejected", "closed"] as const;
export type JobStatus = (typeof VALID_JOB_STATUSES)[number];

export const VALID_APPLICATION_STATUSES = ["applied", "reviewed", "shortlisted", "rejected"] as const;
export type ApplicationStatus = (typeof VALID_APPLICATION_STATUSES)[number];

export const VALID_ROLES = ["student", "company", "admin"] as const;
export type AppRole = (typeof VALID_ROLES)[number];

export const ADMIN_MANAGEABLE_JOB_STATUSES = ["approved", "rejected", "closed"] as const;

export const PAGINATION = {
  JOBS_DEFAULT: 12,
  JOBS_MAX: 50,
  ADMIN_JOBS_DEFAULT: 10,
  ADMIN_JOBS_MAX: 50,
  ADMIN_USERS_DEFAULT: 20,
  ADMIN_USERS_MAX: 100,
  APPLICATIONS_MAX: 50,
  BOOKMARKS_MAX: 50,
} as const;

export const UPLOAD_LIMITS = {
  RESUME_MAX_BYTES: 5 * 1024 * 1024, // 5 MB
  LOGO_MAX_BYTES: 3 * 1024 * 1024, // 3 MB
  ALLOWED_PDF_MIME: "application/pdf" as const,
  ALLOWED_IMAGE_MIMES: ["image/jpeg", "image/png", "image/webp", "image/gif"] as const,
} as const;

export const PROFILE_LIMITS = {
  MAX_SKILLS: 50,
  MAX_SKILL_LENGTH: 50,
  PHONE_MAX: 20,
  BIO_MAX: 2000,
} as const;

export const EXPERIENCE_LEVELS = ["entry", "mid", "senior"] as const;
export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;
export const SORT_OPTIONS = ["newest", "deadline", "salaryHigh", "popular"] as const;
