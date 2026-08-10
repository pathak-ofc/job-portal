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
    phone: { type: String, default: "", trim: true, maxlength: 20 },
    resumeUrl: { type: String, default: "", trim: true },
    skills: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length <= 50 && arr.every((s) => s.length <= 50),
        message: "Too many skills, or a skill name is too long",
      },
    },
    bio: { type: String, default: "", trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

export default mongoose.models.StudentProfile ||
  mongoose.model<IStudentProfile>("StudentProfile", StudentProfileSchema);
