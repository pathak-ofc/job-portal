import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBookmark extends Document {
  studentId: Types.ObjectId;
  jobId: Types.ObjectId;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
  },
  { timestamps: true }
);

// prevent a student from bookmarking the same job twice
BookmarkSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

export default mongoose.models.Bookmark ||
  mongoose.model<IBookmark>("Bookmark", BookmarkSchema);
