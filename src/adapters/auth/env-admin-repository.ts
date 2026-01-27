import type { AdminAuthRepository, AdminUser } from "@/ports/auth";
import type { AdminUserId } from "@/domain/auth/admin-user";

// Stores admin users from environment variables
// Format: ADMIN_USERS=username1:hashedpass1,username2:hashedpass2
export const envAdminRepository = (): AdminAuthRepository => {
  const parseAdmins = (): AdminUser[] => {
    const usersEnv = process.env.ADMIN_USERS || "";
    if (!usersEnv) return [];

    return usersEnv.split(",").map((entry, idx) => {
      const [username, passwordHash] = entry.split(":");
      return {
        id: `admin-${idx}` as AdminUserId,
        username: username.trim(),
        passwordHash: passwordHash.trim(),
        createdAt: new Date().toISOString(),
      };
    });
  };

  const admins = parseAdmins();

  return {
    async findByUsername(username) {
      return admins.find((u) => u.username === username) || null;
    },

    async create(user) {
      admins.push(user);
    },
  };
};
