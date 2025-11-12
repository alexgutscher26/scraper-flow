import { symmetricDecrypt } from "@/lib/encryption";
import { CredentialType, CredentialTypeValue } from "@/schema/credential";

export interface DecryptedCredential {
  id: string;
  name: string;
  type: CredentialTypeValue;
  data: any;
  description?: string;
}

/**
 * Decrypts a credential and returns the structured data
 */
export function decryptCredential(credential: {
  id: string;
  name: string;
  value: string;
  type: string;
  description?: string;
}): DecryptedCredential {
  const decryptedValue = symmetricDecrypt(credential.value);

  return {
    id: credential.id,
    name: credential.name,
    type: credential.type as CredentialTypeValue,
    data: JSON.parse(decryptedValue),
    description: credential.description,
  };
}

/**
 * Get SMTP settings for Gmail only
 * This function now only supports Gmail for simplified setup
 */
function getSmtpSettings(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();

  // Only Gmail is supported - validate email domain
  if (!domain || !["gmail.com", "googlemail.com"].includes(domain)) {
    throw new Error(
      "Only Gmail addresses (@gmail.com) are supported for SMTP configuration"
    );
  }

  // Gmail SMTP settings
  return {
    host: "smtp.gmail.com",
    service: "gmail",
    port: 465,
    secure: true,
  };
}

/**
 * Formats credential data for executor usage
 * Maintains backwards compatibility with existing executors
 */
export function formatCredentialForExecutor(
  credential: DecryptedCredential
): string {
  switch (credential.type) {
    case CredentialType.SMTP_EMAIL:
      // Auto-detect SMTP settings from email and format for SendEmailExecutor
      const smtpSettings = getSmtpSettings(credential.data.email);
      return JSON.stringify({
        host: smtpSettings.host,
        service: smtpSettings.service,
        port: smtpSettings.port,
        user: credential.data.email,
        pass: credential.data.password,
        secure: smtpSettings.secure,
      });

    case CredentialType.API_KEY:
      // Format for API key usage
      return JSON.stringify({
        apiKey: credential.data.apiKey,
        apiSecret: credential.data.apiSecret,
        baseUrl: credential.data.baseUrl,
        headers: credential.data.headers,
      });

    case CredentialType.CUSTOM:
      // Return the raw value for custom credentials
      return credential.data.value;

    default:
      // Fallback for unknown types
      return JSON.stringify(credential.data);
  }
}

/**
 * Get credential display information for UI
 */
export function getCredentialDisplayInfo(credential: DecryptedCredential) {
  switch (credential.type) {
    case CredentialType.SMTP_EMAIL:
      return {
        icon: "Mail",
        subtitle: "Gmail Account",
        fields: ["Gmail Address"],
      };

    case CredentialType.API_KEY:
      return {
        icon: "Key",
        subtitle: credential.data.baseUrl || "API Credentials",
        fields: ["API Key", "Base URL"],
      };

    case CredentialType.CUSTOM:
      return {
        icon: "Settings",
        subtitle: "Custom Format",
        fields: ["Custom Value"],
      };

    default:
      return {
        icon: "Settings",
        subtitle: "Unknown Type",
        fields: [],
      };
  }
}
