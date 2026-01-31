import type {
  MagicLinkToken,
  MagicLinkRepository,
} from "@/domain/auth/magic-link";
import { createMagicLinkToken } from "@/domain/auth/magic-link";

type Store = Map<string, MagicLinkToken>;

const getStore = (): Store => {
  const globalAny = globalThis as { __sightsignal_magic_links_store?: Store };
  if (!globalAny.__sightsignal_magic_links_store) {
    globalAny.__sightsignal_magic_links_store = new Map<
      string,
      MagicLinkToken
    >();
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
    setTimeout(
      () => {
        this.store.delete(token.token);
      },
      15 * 60 * 1000
    ); // 15 minutes

    return token;
  }

  async verify(token: string): Promise<string | null> {
    console.log("[MagicLink] Verifying token:", token);
    console.log("[MagicLink] Store size:", this.store.size);
    console.log("[MagicLink] Store has token:", this.store.has(token));

    const magicLink = this.store.get(token);

    if (!magicLink) {
      console.log("[MagicLink] Token not found in store");
      return null;
    }

    console.log("[MagicLink] Found token, checking expiration...");
    console.log("[MagicLink] Expires at:", magicLink.expiresAt);
    console.log("[MagicLink] Current time:", new Date().toISOString());

    // Check if expired
    if (new Date(magicLink.expiresAt) < new Date()) {
      console.log("[MagicLink] Token expired, deleting");
      this.store.delete(token);
      return null;
    }

    console.log("[MagicLink] Token valid! Email:", magicLink.email);
    return magicLink.email;
  }

  async delete(token: string): Promise<void> {
    this.store.delete(token);
  }
}
