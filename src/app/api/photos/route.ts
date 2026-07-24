import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { getSessionUserId } from "@/lib/coupleAuth";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json([], { status: 401 });

  const { searchParams } = new URL(req.url);
  const coupleId = searchParams.get("coupleId");
  const memoryId = searchParams.get("memoryId");

  const photos = await prisma.photo.findMany({
    where: {
      couple: { OR: [{ userId }, { partnerUserId: userId }] },
      ...(coupleId ? { coupleId } : {}),
      ...(memoryId ? { memoryId } : {}),
    },
    orderBy: { takenAt: "desc" },
  });
  return NextResponse.json(photos);
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const body = await req.json();
  const photo = await prisma.photo.create({
    data: {
      coupleId: body.coupleId,
      url: body.url,
      publicId: body.publicId,
      caption: body.caption,
      takenAt: body.takenAt ? new Date(body.takenAt) : null,
      memoryId: body.memoryId || null,
    },
  });
  return NextResponse.json(photo);
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const photo = await prisma.photo.findUnique({ where: { id }, include: { couple: true } });
  const c = photo?.couple;
  if (!c || (c.userId !== userId && c.partnerUserId !== userId)) {
    return NextResponse.json(null, { status: 403 });
  }
  await cloudinary.uploader.destroy(photo!.publicId).catch(() => {});
  await prisma.photo.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
