import { describe, it, expect, vi, beforeEach } from "vitest";
import * as audit from "../lib/credential/audit";
import prisma from "../lib/prisma";

vi.mock("../lib/prisma", () => {
  return {
    default: {
      credentialAudit: {
        create: vi.fn(async (args: any) => args),
      },
    },
  };
});

describe("credential audit", () => {
  beforeEach(() => {
    process.env.LOG_HASH_KEY = "testkey";
  });

  it("creates audit entry with fingerprint", async () => {
    await audit.logCredentialAccess({
      userId: "u1",
      credentialId: "c1",
      credentialName: "smtp",
      credentialType: "smtp_email",
      requester: "workflow/NAVIGATE_URL",
      method: "db",
      outcome: "success",
      correlationId: "p1",
      accessedValue: "password123",
    });
    const call = (prisma.credentialAudit.create as any).mock.calls[0][0];
    expect(call.data.fingerprint).toBeDefined();
    expect(call.data.userId).toBe("u1");
  });
});
