import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "pimuk-dna", resource_type: "image" },
      (error, result) => {
        if (error || !result) reject(error);
        else resolve(result as { secure_url: string; public_id: string });
      }
    ).end(buffer);
  });

  return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
}
