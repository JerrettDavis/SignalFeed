export type MagicLinkToken = {
  token: string;
  email: string;
  createdAt: string;
  expiresAt: string;
};

export interface MagicLinkRepository {
  create(email: string): Promise<MagicLinkToken>;
  verify(token: string): Promise<string | null>; // Returns email if valid, null if invalid/expired
  delete(token: string): Promise<void>;
}

export const generateToken = (): string => {
  return `magic-${Date.now()}-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
};

export const createMagicLinkToken = (email: string): MagicLinkToken => {
  const token = generateToken();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 15 * 60 * 1000); // 15 minutes

  return {
    token,
    email,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
};
