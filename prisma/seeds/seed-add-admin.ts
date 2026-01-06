import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ============================================
  // ADMIN USER
  // ============================================
  console.log('📋 Seeding Admin User...');

  const adminPassword = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@vaxicare.com' },
    update: {},
    create: {
      email: 'admin@vaxicare.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+919876543210',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created admin user');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('  Admin: admin@vaxicare.com / Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
