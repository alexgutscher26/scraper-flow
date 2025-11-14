'use server';

import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GetCredentialsForUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('User not found');
  }
  try {
    return await prisma.credential.findMany({
      where: {
        userId,
      },
      orderBy: {
        name: 'asc',
      },
    });
  } catch {
    const { listCredentials } = await import('@/lib/credential/memoryStore');
    const items = listCredentials(userId);
    return items.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.name,
      value: c.value,
      type: c.type,
      description: c.description || undefined,
      createdAt: c.createdAt,
    }));
  }
}
