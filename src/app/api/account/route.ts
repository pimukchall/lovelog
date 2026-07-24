import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId, getCoupleForUser } from "@/lib/coupleAuth";
import cloudinary from "@/lib/cloudinary";

export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const couple = await getCoupleForUser(userId);

  // ถ้าเป็นเจ้าของ → ลบทุกอย่างที่เกี่ยวกับ couple ด้วย
  if (couple && couple.userId === userId) {
    // ลบไฟล์ใน Cloudinary
    const photos = await prisma.photo.findMany({ where: { coupleId: couple.id } });
    const members = await prisma.familyMember.findMany({ where: { coupleId: couple.id } });

    await Promise.allSettled([
      ...photos.map((p) => cloudinary.uploader.destroy(p.publicId)),
      ...members.filter((m) => m.publicId).map((m) => cloudinary.uploader.destroy(m.publicId!)),
      couple.person1PublicId && cloudinary.uploader.destroy(couple.person1PublicId),
      couple.person2PublicId && cloudinary.uploader.destroy(couple.person2PublicId),
    ]);

    // ลบ cascade ใน DB
    await prisma.photo.deleteMany({ where: { coupleId: couple.id } });
    await prisma.memory.deleteMany({ where: { coupleId: couple.id } });
    await prisma.familyMember.deleteMany({ where: { coupleId: couple.id } });
    await prisma.couple.delete({ where: { id: couple.id } });
  } else if (couple && couple.partnerUserId === userId) {
    // เป็นแค่ partner → ตัดตัวเองออกจาก couple
    await prisma.couple.update({
      where: { id: couple.id },
      data: { partnerUserId: null },
    });
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}
