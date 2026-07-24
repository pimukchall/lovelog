import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/coupleAuth";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json([], { status: 401 });

  const { searchParams } = new URL(req.url);
  const coupleId = searchParams.get("coupleId");

  const memories = await prisma.memory.findMany({
    where: {
      couple: { OR: [{ userId }, { partnerUserId: userId }] },
      ...(coupleId ? { coupleId } : {}),
    },
    include: { photos: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(memories);
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const body = await req.json();
  const couple = await prisma.couple.findFirst({
    where: { id: body.coupleId, OR: [{ userId }, { partnerUserId: userId }] },
  });
  if (!couple) return NextResponse.json(null, { status: 403 });

  const memory = await prisma.memory.create({
    data: {
      coupleId: body.coupleId,
      title: body.title,
      description: body.description,
      date: new Date(body.date),
      type: body.type || "moment",
    },
    include: { photos: true },
  });
  return NextResponse.json(memory);
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const memory = await prisma.memory.findUnique({ where: { id }, include: { couple: true } });
  const c = memory?.couple;
  if (!c || (c.userId !== userId && c.partnerUserId !== userId)) {
    return NextResponse.json(null, { status: 403 });
  }
  await prisma.memory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
