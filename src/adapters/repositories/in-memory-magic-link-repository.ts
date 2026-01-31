import type { MagicLinkToken, MagicLinkRepository } from "@/domain/auth/magic-link";
import { createMagicLinkToken } from "@/domain/auth/magic-link";

type Store = Map<string, MagicLinkToken>;

const getStore = (): Store => {
  const globalAny = globalThis as { __sightsignal_magic_links_store?: Store };
  if (!globalAny.__sightsignal_magic_links_store) {
    globalAny.__sightsignal_magic_links_store = new Map<string, MagicLinkToken>();
  }
  return globalAny.__sightsignal_magic_links_store;
};

export class InMemoryMagicLinkRepository implements MagicLinkRepository {
  private store: Store;

  constructor() {
    this.store = getStore();
  }

  async create(email: string): Promise<MagicLinkToken> {
    const token = createMagicLinkToken(email);
    this.store.set(token.token, token);
    
    // Auto-cleanup expired tokens
    setTimeout(() => {
      this.store.delete(token.token);
    }, 15 * 60 * 1000); // 15 minutes

    return token;
  }

  async verify(token: string): Promise<string | null> {
    const magicLink = this.store.get(token);
    
    if (!magicLink) {
      return null;
    }

    // Check if expired
    if (new Date(magicLink.expiresAt) < new Date()) {
      this.store.delete(token);
      return null;
    }

    return magicLink.email;
  }

  async delete(token: string): Promise<void> {
    this.store.delete(token);
  }
}
