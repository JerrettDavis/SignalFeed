import { randomBytes } from "crypto";

/**
 * Generate a cryptographically secure random user identifier.
 *
 * SECURITY: Uses crypto.randomBytes rather than Math.random(). User ids gate
 * record ownership, so they must not be predictable/guessable.
 */
export const generateUserId = (): string => {
  return `user-${Date.now()}-${randomBytes(9).toString("hex")}`;
};
