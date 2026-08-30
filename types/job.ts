import type { JobType, JobStatus } from "@/lib/constants";

export type JobDTO = {
  _id: string;
  companyId: string | { _id: string; name: string };
  title: string;
  description: string;
  category: string;
  location: string;
  salaryRange?: string;
  jobType: JobType;
  status: JobStatus;
  deadline: string; // ISO
  createdAt?: string;
  updatedAt?: string;
};

export type PaginationDTO = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: "student" | "company" | "admin";
};
