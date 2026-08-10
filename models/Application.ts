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
    resumeUrl: { type: String, required: true, trim: true },
    coverLetter: { type: String, default: "", trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ["applied", "reviewed", "shortlisted", "rejected"],
      default: "applied",
    },
  },
  { timestamps: true }
);

// prevent a student from applying to the same job twice at the DB level too
ApplicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });
ApplicationSchema.index({ studentId: 1, createdAt: -1 });
ApplicationSchema.index({ jobId: 1, createdAt: -1 });

export default mongoose.models.Application ||
  mongoose.model<IApplication>("Application", ApplicationSchema);
