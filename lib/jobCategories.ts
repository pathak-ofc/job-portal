// Fixed job category taxonomy — used by the job post/edit forms and the
// jobs search filter. Keeping this as a single shared list avoids free-text
// categories fragmenting into near-duplicates (e.g. "Engineering" vs
// "engineering" vs "Software Engineering").
export const JOB_CATEGORIES = [
  "Software Engineering",
  "Web Development",
  "Mobile Development",
  "Data Science & Analytics",
  "IT & Networking",
  "Design (UI/UX & Graphics)",
  "Marketing & Sales",
  "Customer Support",
  "Finance & Accounting",
  "Human Resources",
  "Operations & Administration",
  "Education & Training",
  "Healthcare",
  "Engineering (Non-Software)",
  "Hospitality & Tourism",
  "Media & Communications",
  "Legal",
  "Internship",
  "Other",
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];
