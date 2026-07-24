import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { authRatelimit } from "@/lib/ratelimit";

export const GET = handlers.GET;

export async function POST(req: NextRequest, ctx: unknown) {
  // rate limit เฉพาะ login (callback/credentials)
  if (req.nextUrl.pathname.includes("callback")) {
    const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
    const { success } = await authRatelimit.limit(`login:${ip}`);
    if (!success) {
      return NextResponse.json({ error: "ลองใหม่อีกครั้งในอีกสักครู่" }, { status: 429 });
    }
  }
  return handlers.POST(req, ctx as never);
}
