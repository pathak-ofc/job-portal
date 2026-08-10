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
      validate: {
        validator: function (value: Date) {
          // Deadline must be strictly in the future relative to now.
          // On update, mongoose only re-checks this if `deadline` is modified
          // (see runValidators + isModified checks in the API routes).
          return value.getTime() > Date.now();
        },
        message: "Deadline must be a future date",
      },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "closed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Speed up common queries (public listing filters by status, company dashboard filters by companyId)
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ companyId: 1, createdAt: -1 });
JobSchema.index({ title: "text", description: "text" });

export default mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);
