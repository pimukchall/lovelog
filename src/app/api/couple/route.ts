import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId, getCoupleForUser } from "@/lib/coupleAuth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const couple = await getCoupleForUser(userId);
  return NextResponse.json(couple);
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const body = await req.json();
  const couple = await prisma.couple.create({
    data: {
      userId,
      person1Name: body.person1Name || "",
      person2Name: body.person2Name || "",
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
    },
  });
  return NextResponse.json(couple);
}

export async function PUT(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const body = await req.json();
  const existing = await getCoupleForUser(userId);
  if (!existing || existing.userId !== userId)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const couple = await prisma.couple.update({
    where: { id: existing.id },
    data: {
      ...(body.person1Name !== undefined && { person1Name: body.person1Name }),
      ...(body.person2Name !== undefined && { person2Name: body.person2Name }),
      ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
      ...(body.person1PhotoUrl !== undefined && { person1PhotoUrl: body.person1PhotoUrl }),
      ...(body.person1PublicId !== undefined && { person1PublicId: body.person1PublicId }),
      ...(body.person2PhotoUrl !== undefined && { person2PhotoUrl: body.person2PhotoUrl }),
      ...(body.person2PublicId !== undefined && { person2PublicId: body.person2PublicId }),
    },
  });
  return NextResponse.json(couple);
}
