import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/coupleAuth";

// Toggle reaction — ถ้ามีแล้วลบ, ถ้าไม่มีสร้าง
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const body = await req.json();
  const post = await prisma.post.findUnique({
    where: { id: body.postId },
    include: { couple: true },
  });
  const c = post?.couple;
  if (!c || (c.userId !== userId && c.partnerUserId !== userId)) {
    return NextResponse.json(null, { status: 403 });
  }

  const existing = await prisma.postReaction.findUnique({
    where: { postId_authorId_emoji: { postId: body.postId, authorId: userId, emoji: body.emoji } },
  });

  if (existing) {
    await prisma.postReaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed" });
  }

  await prisma.postReaction.create({
    data: { postId: body.postId, authorId: userId, emoji: body.emoji },
  });
  return NextResponse.json({ action: "added" });
}
