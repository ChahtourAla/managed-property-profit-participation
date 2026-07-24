import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as bcrypt from 'bcryptjs';

import { PrismaClient } from '../src/generated/prisma/client';

async function main() {
  const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';

  const adapter = new PrismaBetterSqlite3({
    url: databaseUrl,
  });

  const prisma = new PrismaClient({
    adapter,
  });

  const email = 'admin@test.com';
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const existingAdmin = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        approvalStatus: 'APPROVED',
        isActive: true,
      },
    });
    console.log('Admin user verified and activated.');
    await prisma.$disconnect();
    return;
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: 'Platform Admin',
      role: 'ADMIN',
      approvalStatus: 'APPROVED',
      isActive: true,
    },
  });

  console.log('Seed admin created: admin@test.com / Password123!');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
