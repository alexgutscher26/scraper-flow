import { symmetricDecrypt } from "@/lib/encryption";
import prisma from "@/lib/prisma";
import {
  formatCredentialForExecutor,
  decryptCredential,
} from "./credentialHelper";

/**
 * Gets a credential by ID and returns the formatted value for use in executors
 */
export async function getCredentialValue(
  credentialId: string,
  userId: string
): Promise<string> {
  if (!credentialId || !userId) {
    throw new Error("Credential ID and User ID are required");
  }
  const credential = await prisma.credential.findFirst({
    where: {
      id: credentialId,
      userId: userId,
    },
  });

  if (!credential) {
    throw new Error("Credential not found");
  }

  const decryptedCredential = decryptCredential({
    ...credential,
    description: credential.description ?? undefined,
  });
  return formatCredentialForExecutor(decryptedCredential);
}

/**
 * Gets a credential by name and returns the formatted value for use in executors
 */
export async function getCredentialValueByName(
  credentialName: string,
  userId: string
): Promise<string> {
  if (!credentialName || !userId) {
    throw new Error("Credential name and User ID are required");
  }
  const credential = await prisma.credential.findFirst({
    where: {
      name: credentialName,
      userId: userId,
    },
  });

  if (!credential) {
    throw new Error("Credential not found");
  }

  const decryptedCredential = decryptCredential({
    ...credential,
    description: credential.description ?? undefined,
  });
  return formatCredentialForExecutor(decryptedCredential);
  return formatCredentialForExecutor(decryptedCredential);
}
