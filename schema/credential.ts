import { z } from "zod";

// Credential types enum
export const CredentialType = {
  SMTP_EMAIL: "smtp_email",
  API_KEY: "api_key",
  CUSTOM: "custom",
  TWO_FACTOR: "two_factor",
} as const;

export type CredentialTypeValue =
  (typeof CredentialType)[keyof typeof CredentialType];

// SMTP Email credential schema - Gmail only for simplified setup
export const smtpEmailCredentialSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .refine((email) => {
      const domain = email.toLowerCase();
      return (
        domain.endsWith("@gmail.com") || domain.endsWith("@googlemail.com")
      );
    }, "Only Gmail addresses (@gmail.com or @googlemail.com) are supported for SMTP configuration"),
  password: z
    .string()
    .min(1, "Gmail App Password is required")
    .refine((p) => {
      const len = p.replace(/\s+/g, "").length;
      return len === 16 || len === 15;
    }, "Gmail App Password must be 15–16 characters (spaces ignored)"),
});

// API Key credential schema
export const apiKeyCredentialSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  apiSecret: z.string().optional(),
  baseUrl: z.string().url().optional(),
  headers: z.record(z.string()).optional(),
});

// Custom credential schema (for backwards compatibility)
export const customCredentialSchema = z.object({
  value: z.string().max(2000, "Value is too long"),
});

// Two-Factor Authentication credential schema
export const twoFactorMethod = {
  TOTP: "totp",
  SMS: "sms",
  EMAIL: "email",
} as const;

export type TwoFactorMethodValue = (typeof twoFactorMethod)[keyof typeof twoFactorMethod];

export const totpCredentialSchema = z.object({
  method: z.literal(twoFactorMethod.TOTP),
  secret: z.string().min(16, "TOTP secret is required"),
  issuer: z.string().optional(),
  period: z.number().int().min(15).max(60).default(30).optional(),
  digits: z.number().int().min(6).max(8).default(6).optional(),
  recoveryCodes: z.array(z.string()).min(5).optional(),
});

export const smsCredentialSchema = z.object({
  method: z.literal(twoFactorMethod.SMS),
  phoneNumber: z.string().min(8, "Phone number is required"),
  provider: z.string().optional(),
  apiKey: z.string().optional(),
  recoveryCodes: z.array(z.string()).min(5).optional(),
});

export const email2faCredentialSchema = z.object({
  method: z.literal(twoFactorMethod.EMAIL),
  email: z.string().email("Valid email required"),
  recoveryCodes: z.array(z.string()).min(5).optional(),
});

// Union schema for all credential types
export const credentialValueSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(CredentialType.SMTP_EMAIL),
    data: smtpEmailCredentialSchema,
  }),
  z.object({
    type: z.literal(CredentialType.API_KEY),
    data: apiKeyCredentialSchema,
  }),
  z.object({
    type: z.literal(CredentialType.CUSTOM),
    data: customCredentialSchema,
  }),
  z.object({
    type: z.literal(CredentialType.TWO_FACTOR),
    data: z.union([totpCredentialSchema, smsCredentialSchema, email2faCredentialSchema]),
  }),
]);

// Main credential creation schema
export const createCredentialSchema = z.object({
  name: z.string().min(1, "Name is required").max(30, "Name is too long"),
  description: z.string().max(200).optional(),
  credentialData: credentialValueSchema,
});

export type createCredentialSchemaType = z.infer<typeof createCredentialSchema>;
export type SmtpEmailCredentialType = z.infer<typeof smtpEmailCredentialSchema>;
export type ApiKeyCredentialType = z.infer<typeof apiKeyCredentialSchema>;
export type CustomCredentialType = z.infer<typeof customCredentialSchema>;
export type TotpCredentialType = z.infer<typeof totpCredentialSchema>;
export type SmsCredentialType = z.infer<typeof smsCredentialSchema>;
export type Email2faCredentialType = z.infer<typeof email2faCredentialSchema>;
