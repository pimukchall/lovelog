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
  const cursor = searchParams.get("cursor");
  const limit = 20;

  const photos = await prisma.photo.findMany({
    where: {
      couple: { OR: [{ userId }, { partnerUserId: userId }] },
      ...(coupleId ? { coupleId } : {}),
      ...(memoryId ? { memoryId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const hasMore = photos.length > limit;
  if (hasMore) photos.pop();
  const nextCursor = hasMore ? photos[photos.length - 1]?.id : null;

  return NextResponse.json({ photos, nextCursor });
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

export async function PUT(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const body = await req.json();
  const photo = await prisma.photo.findUnique({ where: { id: body.id }, include: { couple: true } });
  const c = photo?.couple;
  if (!c || (c.userId !== userId && c.partnerUserId !== userId)) {
    return NextResponse.json(null, { status: 403 });
  }

  const updated = await prisma.photo.update({
    where: { id: body.id },
    data: {
      ...(body.caption !== undefined && { caption: body.caption }),
      ...(body.takenAt !== undefined && { takenAt: body.takenAt ? new Date(body.takenAt) : null }),
    },
  });
  return NextResponse.json(updated);
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
