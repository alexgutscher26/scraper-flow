import prisma from "@/lib/prisma";
import {
  formatCredentialForExecutor,
  decryptCredential,
} from "./credentialHelper";
import { CredentialAccessContext, logCredentialAccess } from "./audit";

/**
 * Gets a credential by ID and returns the formatted value for use in executors.
 *
 * This function checks for the presence of credentialId and userId, retrieves the credential from the database, and logs the access attempt. If the credential is found, it decrypts the credential and formats it for executor use. If the credential is not found, it logs the failure and throws an error.
 *
 * @param credentialId - The ID of the credential to retrieve.
 * @param userId - The ID of the user requesting the credential.
 * @param context - Optional context for credential access, including requester information and method.
 * @returns A promise that resolves to the formatted credential value.
 * @throws Error If the credential ID or user ID is missing, or if the credential is not found.
 */
export async function getCredentialValue(
  credentialId: string,
  userId: string,
  context?: CredentialAccessContext
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
    await logCredentialAccess({
      userId,
      credentialId,
      credentialName: "",
      credentialType: "",
      requester: context?.requester || "workflow/executor",
      method: context?.method || "db",
      outcome: "failure",
      correlationId: context?.correlationId,
      errorMessage: "Credential not found",
    });
    throw new Error("Credential not found");
  }

  const decryptedCredential = decryptCredential({
    ...credential,
    description: credential.description ?? undefined,
  });
  const formatted = formatCredentialForExecutor(decryptedCredential);
  await logCredentialAccess({
    userId,
    credentialId,
    credentialName: credential.name,
    credentialType: credential.type,
    requester: context?.requester || "workflow/executor",
    method: context?.method || "db",
    outcome: "success",
    correlationId: context?.correlationId,
    accessedValue: formatted,
  });
  return formatted;
}

/**
 * Gets a credential by name and returns the formatted value for use in executors
 */
export async function getCredentialValueByName(
  credentialName: string,
  userId: string,
  context?: CredentialAccessContext
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
    await logCredentialAccess({
      userId,
      credentialId: "",
      credentialName: credentialName,
      credentialType: "",
      requester: context?.requester || "workflow/executor",
      method: context?.method || "db",
      outcome: "failure",
      correlationId: context?.correlationId,
      errorMessage: "Credential not found",
    });
    throw new Error("Credential not found");
  }

  const decryptedCredential = decryptCredential({
    ...credential,
    description: credential.description ?? undefined,
  });
  const formatted = formatCredentialForExecutor(decryptedCredential);
  await logCredentialAccess({
    userId,
    credentialId: credential.id,
    credentialName: credential.name,
    credentialType: credential.type,
    requester: context?.requester || "workflow/executor",
    method: context?.method || "db",
    outcome: "success",
    correlationId: context?.correlationId,
    accessedValue: formatted,
  });
  return formatted;
}
