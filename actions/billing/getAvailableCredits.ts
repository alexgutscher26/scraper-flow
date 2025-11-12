"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GetAvailableCredits() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not found");
  }
  const balance = await prisma.userBalance.upsert({
    where: { userId },
    create: { userId, credits: 1000 },
    update: {},
    select: { credits: true },
  });
  return balance.credits;
}
