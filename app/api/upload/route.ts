import { NextRequest, NextResponse } from "next/server";
import cloudinary, { getCloudinaryFolderForMime } from "@/lib/cloudinary";
import { auth } from "@/auth";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import { UPLOAD_LIMITS } from "@/lib/constants";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const ALLOWED_MIMES = new Set<string>([
  UPLOAD_LIMITS.ALLOWED_PDF_MIME,
  ...UPLOAD_LIMITS.ALLOWED_IMAGE_MIMES,
]);

function getMagicBytes(buffer: Buffer): string {
  if (buffer.length < 4) return "";
  return buffer.subarray(0, 4).toString("hex");
}

function isValidMagicForMime(buffer: Buffer, mime: string): boolean {
  const hex = getMagicBytes(buffer);
  const ascii = buffer.subarray(0, 5).toString("ascii");
  if (mime === "application/pdf") {
    // PDF must start with %PDF
    return ascii.startsWith("%PDF");
  }
  if (mime === "image/jpeg") return hex.startsWith("ffd8ff");
  if (mime === "image/png") return hex.startsWith("89504e47");
  if (mime === "image/gif") return hex.startsWith("47494638");
  if (mime === "image/webp") {
    // WebP: RIFF....WEBP
    if (buffer.length < 12) return false;
    return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipLimit = await rateLimit(`upload-ip:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
    if (!ipLimit.allowed) {
      return NextResponse.json({ message: "Too many uploads — please slow down" }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userLimit = await rateLimit(`upload-user:${session.user.id}`, { limit: 15, windowMs: 15 * 60 * 1000 });
    if (!userLimit.allowed) {
      return NextResponse.json({ message: "Too many uploads — please try again later" }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    const mime = file.type;

    if (!ALLOWED_MIMES.has(mime)) {
      return NextResponse.json(
        { message: "Only PDF and image (JPEG/PNG/WebP/GIF) files are allowed" },
        { status: 400 }
      );
    }

    const maxSize =
      mime === UPLOAD_LIMITS.ALLOWED_PDF_MIME
        ? UPLOAD_LIMITS.RESUME_MAX_BYTES
        : UPLOAD_LIMITS.LOGO_MAX_BYTES;

    if (file.size > maxSize) {
      const maxMb = Math.round(maxSize / (1024 * 1024));
      return NextResponse.json(
        { message: `File too large — max ${maxMb}MB` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidMagicForMime(buffer, mime)) {
      return NextResponse.json(
        { message: "File content does not match its type — possibly corrupted or spoofed" },
        { status: 400 }
      );
    }

    const folder = getCloudinaryFolderForMime(mime) || "resumes";
    const resourceType = mime === "application/pdf" ? "raw" : "image";

    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: resourceType as "raw" | "image", folder },
          (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
            if (error || !result) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    return NextResponse.json({ url: uploadResult.secure_url, resourceType, folder });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Upload failed" },
      { status: 500 }
    );
  }
}