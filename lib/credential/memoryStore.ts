import crypto from 'crypto';

type MemoryCredential = {
  id: string;
  userId: string;
  name: string;
  value: string;
  type: string;
  description?: string | null;
  createdAt: Date;
};

type Store = Map<string, MemoryCredential[]>;

const store: Store = (global as any).__credStore || new Map();
(global as any).__credStore = store;

export function addCredential(rec: Omit<MemoryCredential, 'id' | 'createdAt'>): MemoryCredential {
  const id = crypto.randomUUID();
  const createdAt = new Date();
  const full: MemoryCredential = { id, createdAt, ...rec };
  const arr = store.get(rec.userId) || [];
  arr.push(full);
  store.set(rec.userId, arr);
  return full;
}

export function listCredentials(userId: string): MemoryCredential[] {
  const arr = store.get(userId) || [];
  return arr.slice().sort((a, b) => a.name.localeCompare(b.name));
}
