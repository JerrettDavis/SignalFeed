export type AdminUserId = string & { readonly __brand: "AdminUserId" };

export type AdminUser = {
  id: AdminUserId;
  username: string;
  passwordHash: string;
  createdAt: string;
};

export type AdminCredentials = {
  username: string;
  password: string;
};
