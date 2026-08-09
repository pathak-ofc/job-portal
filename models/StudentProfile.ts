import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStudentProfile extends Document {
  userId: Types.ObjectId;
  phone: string;
  resumeUrl: string;
  skills: string[];
  bio: string;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    phone: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
    skills: { type: [String], default: [] },
    bio: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.StudentProfile ||
  mongoose.model<IStudentProfile>("StudentProfile", StudentProfileSchema);
