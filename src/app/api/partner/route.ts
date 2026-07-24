import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId, getCoupleForUser } from "@/lib/coupleAuth";

// DELETE — ตัดการเชื่อมต่อ partner (เฉพาะเจ้าของ)
export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const couple = await getCoupleForUser(userId);
  if (!couple) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
  if (couple.userId !== userId) return NextResponse.json({ error: "เฉพาะเจ้าของเท่านั้น" }, { status: 403 });
  if (!couple.partnerUserId) return NextResponse.json({ error: "ยังไม่มี partner" }, { status: 400 });

  await prisma.couple.update({
    where: { id: couple.id },
    data: { partnerUserId: null },
  });

  return NextResponse.json({ success: true });
}
