import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma';

async function main() {
  const email = process.argv[2] || 'aymen.abid@taleemabad.com';
  const password = process.argv[3] || 'Taleemabad1';
  const name = process.argv[4] || 'Aymen';

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { name, email, passwordHash },
    select: { id: true, name: true, email: true },
  });

  console.log('User ready:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
