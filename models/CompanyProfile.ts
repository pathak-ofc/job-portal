import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICompanyProfile extends Document {
  userId: Types.ObjectId;
  companyName: string;
  logoUrl: string;
  website: string;
  description: string;
  verified: boolean;
}

const CompanyProfileSchema = new Schema<ICompanyProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
    logoUrl: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true, maxlength: 300 },
    description: { type: String, default: "", trim: true, maxlength: 5000 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.CompanyProfile ||
  mongoose.model<ICompanyProfile>("CompanyProfile", CompanyProfileSchema);
