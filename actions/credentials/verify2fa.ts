"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { decryptCredential } from "@/lib/credential/credentialHelper";
import { CredentialType } from "@/schema/credential";
import { verifyTOTP, hashRecoveryCode } from "@/lib/credential/totp";
import { symmetricEncrypt } from "@/lib/encryption";

/**
 * Verify the two-factor authentication code for a given credential.
 *
 * This function first checks the user's authorization and retrieves the credential from the database.
 * It then decrypts the credential and verifies if it is of type TWO_FACTOR. Depending on the method,
 * it either verifies a TOTP code or checks a hashed recovery code against stored recovery codes,
 * updating the credential if a recovery code is used successfully.
 *
 * @param credentialId - The ID of the credential to verify.
 * @param code - The two-factor authentication code or recovery code provided by the user.
 * @returns An object indicating the success of the verification process.
 * @throws Error If the user is unauthorized, the credential is not found,
 *               the credential type is invalid, or if the verification fails.
 */
export async function VerifyTwoFactor({ credentialId, code }: { credentialId: string; code: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("unauthorized");
  const cred = await prisma.credential.findUnique({ where: { id: credentialId } });
  if (!cred || cred.userId !== userId) throw new Error("not found");
  const d = decryptCredential(cred);
  if (d.type !== CredentialType.TWO_FACTOR) throw new Error("invalid credential type");
  const method = d.data.method;
  if (method === "totp") {
    const ok = verifyTOTP(d.data.secret, code, { period: d.data.period || 30, digits: d.data.digits || 6, window: 1 });
    return { success: ok };
  }
  // Recovery code check (hashed)
  const hashed = hashRecoveryCode(code);
  const codes: string[] = d.data.recoveryCodes || [];
  const idx = codes.findIndex((c: string) => c === hashed);
  if (idx >= 0) {
    // consume recovery code: remove it
    codes.splice(idx, 1);
    const newValue = symmetricEncrypt(JSON.stringify({ ...d.data, recoveryCodes: codes }));
    await prisma.credential.update({ where: { id: cred.id }, data: { value: newValue } });
    return { success: true };
  }
  return { success: false };
}
