import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { getSessionUserId } from "@/lib/coupleAuth";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json([], { status: 401 });

  const { searchParams } = new URL(req.url);
  const coupleId = searchParams.get("coupleId");
  if (!coupleId) return NextResponse.json([]);

  const members = await prisma.familyMember.findMany({
    where: { coupleId, couple: { OR: [{ userId }, { partnerUserId: userId }] } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(members);
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const body = await req.json();
  const count = await prisma.familyMember.count({ where: { coupleId: body.coupleId } });
  const member = await prisma.familyMember.create({
    data: {
      coupleId: body.coupleId,
      name: body.name,
      photoUrl: body.photoUrl ?? null,
      publicId: body.publicId ?? null,
      order: count,
    },
  });
  return NextResponse.json(member);
}

export async function PUT(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const body = await req.json();
  const member = await prisma.familyMember.update({
    where: { id: body.id },
    data: {
      name: body.name,
      ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl }),
      ...(body.publicId !== undefined && { publicId: body.publicId }),
    },
  });
  return NextResponse.json(member);
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const member = await prisma.familyMember.findUnique({ where: { id }, include: { couple: true } });
  const c = member?.couple;
  if (!c || (c.userId !== userId && c.partnerUserId !== userId)) {
    return NextResponse.json(null, { status: 403 });
  }
  if (member!.publicId) await cloudinary.uploader.destroy(member!.publicId).catch(() => {});
  await prisma.familyMember.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
