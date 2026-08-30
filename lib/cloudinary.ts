import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function isValidCloudinaryUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return parsed.hostname === "res.cloudinary.com";
    // Accept both raw and image resource types under our cloud name
    return (
      parsed.hostname === "res.cloudinary.com" &&
      parsed.pathname.includes(`/${cloudName}/`) &&
      parsed.protocol === "https:"
    );
  } catch {
    return false;
  }
}

export function getCloudinaryFolderForMime(mime: string): "resumes" | "logos" | null {
  if (mime === "application/pdf") return "resumes";
  if (mime.startsWith("image/")) return "logos";
  return null;
}

export default cloudinary;