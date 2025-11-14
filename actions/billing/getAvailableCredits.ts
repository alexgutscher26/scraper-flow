'use server';

import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

/**
 * Retrieves the available credits for the authenticated user.
 *
 * This function first authenticates the user to obtain the userId. If the userId is not found, it throws an error.
 * It then uses the userId to either create a new user balance with a default of 1000 credits or update the existing balance.
 * Finally, it returns the current credits available for the user.
 */
export async function GetAvailableCredits() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('User not found');
  }
  const balance = await prisma.userBalance.upsert({
    where: { userId },
    create: { userId, credits: 1000 },
    update: {},
    select: { credits: true },
  });
  return balance.credits;
}
