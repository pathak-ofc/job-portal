import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { message: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { message: "File too large — max 5MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "raw", folder: "resumes" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (error) {
    return NextResponse.json(
      { message: "Upload failed", error: (error as Error).message },
      { status: 500 }
    );
  }
}