import bcrypt from "bcrypt";

const password = "@Jd02yz85";
const hash = "$2b$10$6mSMQ1AthNtG9BeaJ5Npqu4fU53kZ05VlwSSrshuFawERyKcUenk6";

console.log("Testing password:", password);
console.log("Against hash:", hash);

bcrypt.compare(password, hash).then(result => {
  console.log("\nPassword match:", result);

  if (!result) {
    console.log("\nREGENERATING HASH...");
    bcrypt.hash(password, 10).then(newHash => {
      console.log("New hash:", newHash);
      console.log("\nUpdate your .env with:");
      console.log(`ADMIN_USERS=admin:${newHash}`);
    });
  }
}).catch(err => {
  console.error("Error:", err);
});
