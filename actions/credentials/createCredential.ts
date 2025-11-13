"use server";

import { symmetricEncrypt } from "@/lib/encryption";
import prisma from "@/lib/prisma";
import {
  createCredentialSchema,
  createCredentialSchemaType,
  CredentialType,
} from "@/schema/credential";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function CreateCredential(form: createCredentialSchemaType) {
  const { success, data } = createCredentialSchema.safeParse(form);
  if (!success) {
    throw new Error("Invalid form data");
  }
  const { userId } = await auth();
  if (!userId) {
    throw new Error("unauthorized");
  }

  // Prepare credential payload with secure processing for 2FA
  let processedData: any = data.credentialData.data;
  if (data.credentialData.type === CredentialType.TWO_FACTOR) {
    const maybeCodes: string[] | undefined = (processedData?.recoveryCodes as any) || [];
    if (maybeCodes && maybeCodes.length) {
      const hashed = maybeCodes.map((code) =>
        require("node:crypto").createHash("sha256").update(code).digest("hex")
      );
      processedData = { ...processedData, recoveryCodes: hashed };
    }
  }
  // Convert the structured credential data to JSON string
  const credentialValue = JSON.stringify(processedData);
  const encryptedValue = symmetricEncrypt(credentialValue);

  const result = await prisma.credential.create({
    data: {
      userId,
      name: data.name,
      value: encryptedValue,
      type: data.credentialData.type,
      description: data.description,
    },
  });
  if (!result) {
    throw new Error("Failed to create credential");
  }
  revalidatePath("/credentials");
}
