import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/coupleAuth";

// ถ้ายังไม่มี reaction หรือ emoji ต่างกัน → upsert
// ถ้า emoji เดิม → ลบออก (toggle off)
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

  const existing = await prisma.postReaction.findFirst({
    where: { postId: body.postId, authorId: userId },
  });

  if (existing && existing.emoji === body.emoji) {
    // กด emoji เดิม = ยกเลิก
    await prisma.postReaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed", emoji: body.emoji });
  }

  // upsert — สร้างใหม่หรือเปลี่ยน emoji
  if (existing) {
    const reaction = await prisma.postReaction.update({
      where: { id: existing.id },
      data: { emoji: body.emoji },
    });
    return NextResponse.json({ action: "added", emoji: reaction.emoji });
  }

  const reaction = await prisma.postReaction.create({
    data: { postId: body.postId, authorId: userId, emoji: body.emoji },
  });
  return NextResponse.json({ action: "added", emoji: reaction.emoji });
}
