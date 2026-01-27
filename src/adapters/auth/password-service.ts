import bcrypt from "bcrypt";
import type { PasswordService } from "@/ports/auth";

const SALT_ROUNDS = 10;

export const passwordService = (): PasswordService => {
  return {
    async hash(password) {
      return bcrypt.hash(password, SALT_ROUNDS);
    },

    async verify(password, hash) {
      return bcrypt.compare(password, hash);
    },
  };
};
