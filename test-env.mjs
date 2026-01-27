import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '.env') });

console.log('ADMIN_AUTH_ENABLED:', process.env.ADMIN_AUTH_ENABLED);
console.log('ADMIN_JWT_SECRET exists:', !!process.env.ADMIN_JWT_SECRET);
console.log('ADMIN_JWT_SECRET length:', process.env.ADMIN_JWT_SECRET?.length);
console.log('ADMIN_USERS:', process.env.ADMIN_USERS);

// Parse admin users
const usersEnv = process.env.ADMIN_USERS || "";
const users = usersEnv.split(",").map((entry, idx) => {
  const [username, passwordHash] = entry.split(":");
  return {
    id: `admin-${idx}`,
    username: username.trim(),
    passwordHash: passwordHash.trim(),
  };
});

console.log('\nParsed users:');
console.log(JSON.stringify(users, null, 2));
