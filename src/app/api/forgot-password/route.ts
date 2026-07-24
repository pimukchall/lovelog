import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";
import { getForgotRatelimit } from "@/lib/ratelimit";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await getForgotRatelimit().limit(ip);
  if (!success) return NextResponse.json({ error: "ส่งได้สูงสุด 3 ครั้งต่อ 10 นาที" }, { status: 429 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "ต้องระบุ email" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  // ตอบ ok เสมอเพื่อไม่เปิดเผยว่า email มีในระบบหรือไม่
  if (!user) return NextResponse.json({ ok: true });

  // ลบ token เก่าของ user นี้ก่อน
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ชั่วโมง

  await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${token}`;

  await resend.emails.send({
    from: process.env.RESEND_FROM!,
    to: email,
    subject: "Lovelog — ตั้งรหัสผ่านใหม่",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
        <h2 style="color:#c44dff">💕 Lovelog</h2>
        <p>มีคำขอตั้งรหัสผ่านใหม่สำหรับบัญชี <strong>${email}</strong></p>
        <a href="${resetUrl}"
           style="display:inline-block;margin:24px 0;padding:12px 28px;background:linear-gradient(135deg,#ff6b9d,#c44dff);color:#fff;text-decoration:none;border-radius:12px;font-weight:600">
          ตั้งรหัสผ่านใหม่
        </a>
        <p style="color:#888;font-size:13px">ลิงก์ใช้ได้ภายใน 1 ชั่วโมง หากไม่ได้ขอ ไม่ต้องทำอะไร</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
