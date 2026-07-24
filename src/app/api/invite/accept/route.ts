import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId, getCoupleForUser } from "@/lib/coupleAuth";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "ไม่มี token" }, { status: 400 });

  // ตรวจว่า user นี้มี couple แล้วหรือยัง
  const existing = await getCoupleForUser(userId);
  if (existing) return NextResponse.json({ error: "คุณมีข้อมูลคู่รักอยู่แล้ว" }, { status: 409 });

  const couple = await prisma.couple.findUnique({ where: { inviteToken: token } });
  if (!couple) return NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือหมดอายุ" }, { status: 404 });
  if (couple.userId === userId) return NextResponse.json({ error: "ไม่สามารถใช้ลิงก์ของตัวเองได้" }, { status: 400 });
  if (couple.partnerUserId) return NextResponse.json({ error: "ลิงก์นี้ถูกใช้ไปแล้ว" }, { status: 409 });

  await prisma.couple.update({
    where: { id: couple.id },
    data: { partnerUserId: userId, inviteToken: null },
  });

  return NextResponse.json({ success: true });
}
