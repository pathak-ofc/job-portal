import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICompanyProfile extends Document {
  userId: Types.ObjectId;
  companyName: string;
  logoUrl: string;
  website: string;
  description: string;
  verified: boolean;
  // employer branding
  industry?: string;
  size?: string; // e.g. "1-10", "11-50", "51-200", "201-500", "500+"
  foundedYear?: number;
  location?: string;
}

const CompanyProfileSchema = new Schema<ICompanyProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
    logoUrl: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true, maxlength: 300 },
    description: { type: String, default: "", trim: true, maxlength: 5000 },
    verified: { type: Boolean, default: false },
    industry: { type: String, default: "", trim: true, maxlength: 100 },
    size: {
      type: String,
      default: "",
      trim: true,
      enum: ["", "1-10", "11-50", "51-200", "201-500", "500+"],
    },
    foundedYear: { type: Number, min: 1800, max: 2100, required: false },
    location: { type: String, default: "", trim: true, maxlength: 150 },
  },
  { timestamps: true }
);

export default mongoose.models.CompanyProfile ||
  mongoose.model<ICompanyProfile>("CompanyProfile", CompanyProfileSchema);
