import mongoose, { Schema, Document, Types } from "mongoose";

export interface IApplication extends Document {
  jobId: Types.ObjectId;
  studentId: Types.ObjectId;
  resumeUrl: string;
  coverLetter: string;
  status: "applied" | "reviewed" | "shortlisted" | "rejected";
}

const ApplicationSchema = new Schema<IApplication>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resumeUrl: { type: String, required: true },
    coverLetter: { type: String, default: "" },
    status: {
      type: String,
      enum: ["applied", "reviewed", "shortlisted", "rejected"],
      default: "applied",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Application ||
  mongoose.model<IApplication>("Application", ApplicationSchema);
