import bcrypt from "bcrypt";

const password = "Password!";
const hash = "$2b$10$3ucZ/lmCdbbQNyxmXgDv2uBIXueZcUdtKpJVYkd5NvVdZyZVyRl3C";

console.log("Testing password:", password);
console.log("Against hash:", hash);

const result = await bcrypt.compare(password, hash);
console.log("\n✓ Password verification:", result ? "SUCCESS" : "FAILED");

if (result) {
  console.log("\n✅ Hash is correct and ready to use!");
} else {
  console.log("\n❌ Hash does not match - regenerating...");
  const newHash = await bcrypt.hash(password, 10);
  console.log("New hash:", newHash);
}
