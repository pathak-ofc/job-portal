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
    companyName: { type: String, required: true },
    logoUrl: { type: String, default: "" },
    website: { type: String, default: "" },
    description: { type: String, default: "" },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.CompanyProfile ||
  mongoose.model<ICompanyProfile>("CompanyProfile", CompanyProfileSchema);
