import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/coupleAuth";

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

  const comment = await prisma.postComment.create({
    data: { postId: body.postId, authorId: userId, content: body.content },
  });
  return NextResponse.json(comment);
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const comment = await prisma.postComment.findUnique({ where: { id } });
  if (!comment || comment.authorId !== userId) {
    return NextResponse.json(null, { status: 403 });
  }

  await prisma.postComment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
