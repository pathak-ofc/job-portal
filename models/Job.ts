import mongoose, { Schema, Document, Types } from "mongoose";

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
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    salaryRange: { type: String, default: "" },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "internship"],
      required: true,
    },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "closed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);
