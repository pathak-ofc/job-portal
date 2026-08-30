import mongoose, { Schema, Document, Types } from "mongoose";
import { JOB_CATEGORIES } from "@/lib/jobCategories";

export interface IJob extends Document {
  companyId: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  location: string;
  salaryRange: string;
  jobType: "full-time" | "part-time" | "internship";
  deadline: Date;
  status: "pending" | "approved" | "rejected" | "closed";
  // new fields for job-seeker / poster insights
  viewCount: number;
  isRemote: boolean;
  experienceLevel?: "entry" | "mid" | "senior";
  salaryMin?: number;
  salaryMax?: number;
}

const JobSchema = new Schema<IJob>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 10000 },
    category: { type: String, required: true, trim: true, enum: JOB_CATEGORIES },
    location: { type: String, required: true, trim: true, maxlength: 150 },
    salaryRange: { type: String, default: "", trim: true, maxlength: 100 },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "internship"],
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
      // Future-date validation is enforced in API routes (jobCreateSchema / jobUpdate)
      // rather than at the schema level to avoid breaking seed data, admin re-edits,
      // and closed/rejected jobs whose deadlines naturally pass.
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "closed"],
      default: "pending",
    },
    viewCount: { type: Number, default: 0, min: 0 },
    isRemote: { type: Boolean, default: false },
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior"],
      required: false,
    },
    salaryMin: { type: Number, min: 0, required: false },
    salaryMax: { type: Number, min: 0, required: false },
  },
  { timestamps: true }
);

// Speed up common queries (public listing filters by status, company dashboard filters by companyId)
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ companyId: 1, createdAt: -1 });
JobSchema.index({ title: "text", description: "text" });
JobSchema.index({ location: 1 });
JobSchema.index({ category: 1 });
JobSchema.index({ jobType: 1 });
JobSchema.index({ deadline: 1 });
JobSchema.index({ isRemote: 1 });
JobSchema.index({ viewCount: -1 });
JobSchema.index({ salaryMin: 1, salaryMax: 1 });

export default mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);
