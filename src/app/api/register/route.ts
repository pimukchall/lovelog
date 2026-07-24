import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authRatelimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await authRatelimit.limit(ip);
  if (!success) return NextResponse.json({ error: "ลองใหม่อีกครั้งในอีกสักครู่" }, { status: 429 });

  const { email, password } = await req.json();
  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบหรือรหัสผ่านสั้นเกินไป" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email นี้ถูกใช้แล้ว" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  return NextResponse.json({ id: user.id, email: user.email });
}
