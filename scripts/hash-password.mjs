import bcrypt from 'bcryptjs';
const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run admin:hash-password -- "Your Strong Password"');
  process.exit(1);
}
const hash = await bcrypt.hash(password, 12);
console.log(hash);
