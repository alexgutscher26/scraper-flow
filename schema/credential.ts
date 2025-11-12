import { z } from "zod";

// Credential types enum
export const CredentialType = {
  SMTP_EMAIL: "smtp_email",
  API_KEY: "api_key",
  CUSTOM: "custom",
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
  password: z.string().min(1, "Gmail App Password is required"),
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
