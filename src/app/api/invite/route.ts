import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId, getCoupleForUser } from "@/lib/coupleAuth";
import crypto from "crypto";

// GET /api/invite — generate หรือดึง token ที่มีอยู่
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const couple = await getCoupleForUser(userId);
  if (!couple) return NextResponse.json({ error: "ยังไม่มีข้อมูลคู่รัก" }, { status: 404 });

  // เฉพาะเจ้าของเท่านั้นที่ generate invite ได้
  if (couple.userId !== userId) {
    return NextResponse.json({ error: "เฉพาะเจ้าของเท่านั้น" }, { status: 403 });
  }

  let token = couple.inviteToken;
  if (!token) {
    token = crypto.randomBytes(16).toString("hex");
    await prisma.couple.update({ where: { id: couple.id }, data: { inviteToken: token } });
  }

  return NextResponse.json({ token, partnerLinked: !!couple.partnerUserId });
}

// DELETE /api/invite — revoke token
export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const couple = await getCoupleForUser(userId);
  if (!couple || couple.userId !== userId) return NextResponse.json(null, { status: 403 });

  await prisma.couple.update({ where: { id: couple.id }, data: { inviteToken: null } });
  return NextResponse.json({ success: true });
}
