import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/generate-admin-hash.mjs <password>");
  process.exit(1);
}

try {
  const hash = await bcrypt.hash(password, 10);
  console.log("\n✓ Password hashed successfully!\n");
  console.log("Hashed password:");
  console.log(hash);
  console.log("\nAdd to .env as:");
  console.log(`ADMIN_USERS=admin:${hash}`);
  console.log("\nFor multiple admins, separate with commas:");
  console.log(`ADMIN_USERS=admin:${hash},admin2:${hash}\n`);
} catch (error) {
  console.error("Error hashing password:", error);
  process.exit(1);
}
