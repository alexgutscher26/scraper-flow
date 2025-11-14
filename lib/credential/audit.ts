import prisma from '../prisma';
import crypto from 'crypto';

export type CredentialAccessContext = {
  requester: string;
  method: string;
  correlationId?: string;
};

/**
 * Generates a SHA-256 fingerprint for the given value.
 */
function fingerprint(value: string): string {
  const key = process.env.LOG_HASH_KEY || '';
  return key
    ? crypto.createHmac('sha256', key).update(value).digest('hex').slice(0, 24)
    : crypto.createHash('sha256').update(value).digest('hex').slice(0, 24);
}

/**
 * Logs access to a credential with relevant details.
 */
export async function logCredentialAccess(args: {
  userId: string;
  credentialId: string;
  credentialName: string;
  credentialType: string;
  requester: string;
  method: string;
  outcome: 'success' | 'failure';
  correlationId?: string;
  accessedValue?: string;
  errorMessage?: string;
}) {
  const fp = args.accessedValue
    ? fingerprint(args.accessedValue)
    : fingerprint(`${args.userId}:${args.credentialId}:${args.credentialName}`);
  await prisma.credentialAudit.create({
    data: {
      userId: args.userId,
      credentialId: args.credentialId,
      credentialName: args.credentialName,
      credentialType: args.credentialType,
      requester: args.requester,
      method: args.method,
      outcome: args.outcome,
      correlationId: args.correlationId,
      fingerprint: fp,
      errorMessage: args.errorMessage,
    },
  });
}
