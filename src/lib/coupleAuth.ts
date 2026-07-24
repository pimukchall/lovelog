import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getSessionUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** หา couple ที่ user เป็นเจ้าของหรือเป็น partner */
export async function getCoupleForUser(userId: string) {
  return prisma.couple.findFirst({
    where: {
      OR: [{ userId }, { partnerUserId: userId }],
    },
  });
}
