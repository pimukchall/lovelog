import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { getSessionUserId } from "@/lib/coupleAuth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json([], { status: 401 });

  const posts = await prisma.post.findMany({
    where: { couple: { OR: [{ userId }, { partnerUserId: userId }] } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const body = await req.json();
  const couple = await prisma.couple.findFirst({
    where: { OR: [{ userId }, { partnerUserId: userId }] },
  });
  if (!couple) return NextResponse.json(null, { status: 403 });

  const post = await prisma.post.create({
    data: {
      coupleId: couple.id,
      authorId: userId,
      content: body.content,
      imageUrl: body.imageUrl ?? null,
      publicId: body.publicId ?? null,
    },
  });
  return NextResponse.json(post);
}

export async function PUT(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const body = await req.json();
  const existing = await prisma.post.findUnique({ where: { id: body.id } });
  if (!existing || existing.authorId !== userId) {
    return NextResponse.json(null, { status: 403 });
  }

  // ถ้าเปลี่ยนรูป ลบรูปเก่าออกจาก Cloudinary
  if (body.publicId && existing.publicId && body.publicId !== existing.publicId) {
    await cloudinary.uploader.destroy(existing.publicId).catch(() => {});
  }

  const post = await prisma.post.update({
    where: { id: body.id },
    data: {
      content: body.content,
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      ...(body.publicId !== undefined && { publicId: body.publicId }),
    },
  });
  return NextResponse.json(post);
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post || post.authorId !== userId) {
    return NextResponse.json(null, { status: 403 });
  }

  if (post.publicId) await cloudinary.uploader.destroy(post.publicId).catch(() => {});
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
