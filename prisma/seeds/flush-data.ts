import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type FlushOption = 'all' | 'vaccines' | 'users' | 'appointments' | 'knowledge';

async function main() {
  const args = process.argv.slice(2);
  const option = (args[0] || 'help') as FlushOption | 'help';

  console.log('🧹 Vaxicare Data Flush Utility\n');

  if (option === 'help' || !['all', 'vaccines', 'users', 'appointments', 'knowledge'].includes(option)) {
    console.log('Usage: npx tsx prisma/seeds/flush-data.ts <option>\n');
    console.log('Options:');
    console.log('  all          - Delete ALL data (WARNING: Complete data loss)');
    console.log('  vaccines     - Delete vaccines, schedules, and inventory');
    console.log('  users        - Delete parents, children, medical staff (keeps admins)');
    console.log('  appointments - Delete appointments and vaccination records');
    console.log('  knowledge    - Delete knowledge base articles only');
    console.log('\nExamples:');
    console.log('  npx tsx prisma/seeds/flush-data.ts vaccines');
    console.log('  npx tsx prisma/seeds/flush-data.ts all\n');
    return;
  }

  // Confirmation check
  if (!args.includes('--confirm')) {
    console.log(`⚠️  You are about to delete data with option: ${option}`);
    console.log('   Add --confirm flag to proceed.\n');
    console.log(`   npx tsx prisma/seeds/flush-data.ts ${option} --confirm\n`);
    return;
  }

  console.log(`🗑️  Flushing data with option: ${option}\n`);

  switch (option) {
    case 'all':
      await flushAll();
      break;
    case 'vaccines':
      await flushVaccines();
      break;
    case 'users':
      await flushUsers();
      break;
    case 'appointments':
      await flushAppointments();
      break;
    case 'knowledge':
      await flushKnowledge();
      break;
  }

  console.log('\n✅ Flush completed!');
}

async function flushAll() {
  console.log('Deleting all data...\n');

  // Order matters due to foreign key constraints
  const operations = [
    { name: 'Stock Requests', action: () => prisma.stockRequest.deleteMany({}) },
    { name: 'Token Blacklist', action: () => prisma.tokenBlacklist.deleteMany({}) },
    { name: 'Vaccination Records', action: () => prisma.vaccinationRecord.deleteMany({}) },
    { name: 'Appointments', action: () => prisma.appointment.deleteMany({}) },
    { name: 'Vaccine Inventory', action: () => prisma.vaccineInventory.deleteMany({}) },
    { name: 'Vaccine Schedules', action: () => prisma.vaccineSchedule.deleteMany({}) },
    { name: 'Children', action: () => prisma.child.deleteMany({}) },
    { name: 'Parents', action: () => prisma.parent.deleteMany({}) },
    { name: 'Medical Staff', action: () => prisma.medicalStaff.deleteMany({}) },
    { name: 'Vaccines', action: () => prisma.vaccine.deleteMany({}) },
    { name: 'Vaccination Centers', action: () => prisma.vaccinationCenter.deleteMany({}) },
    { name: 'Villages', action: () => prisma.village.deleteMany({}) },
    { name: 'Talukas', action: () => prisma.taluka.deleteMany({}) },
    { name: 'Districts', action: () => prisma.district.deleteMany({}) },
    { name: 'Knowledge Base', action: () => prisma.knowledgeBase.deleteMany({}) },
    { name: 'OTPs', action: () => prisma.otp.deleteMany({}) },
    // Note: Admins are NOT deleted to preserve admin access
  ];

  for (const op of operations) {
    const result = await op.action();
    console.log(`   ✓ ${op.name}: ${result.count} records deleted`);
  }

  console.log('\n   ⚠️  Admins preserved (not deleted)');
}

async function flushVaccines() {
  console.log('Deleting vaccine-related data...\n');

  const operations = [
    { name: 'Vaccination Records', action: () => prisma.vaccinationRecord.deleteMany({}) },
    { name: 'Appointments', action: () => prisma.appointment.deleteMany({}) },
    { name: 'Vaccine Inventory', action: () => prisma.vaccineInventory.deleteMany({}) },
    { name: 'Vaccine Schedules', action: () => prisma.vaccineSchedule.deleteMany({}) },
    { name: 'Vaccines', action: () => prisma.vaccine.deleteMany({}) },
  ];

  for (const op of operations) {
    const result = await op.action();
    console.log(`   ✓ ${op.name}: ${result.count} records deleted`);
  }
}

async function flushUsers() {
  console.log('Deleting user-related data (keeping admins)...\n');

  const operations = [
    { name: 'Stock Requests', action: () => prisma.stockRequest.deleteMany({}) },
    { name: 'Token Blacklist (non-admin)', action: () => prisma.tokenBlacklist.deleteMany({ where: { adminId: null } }) },
    { name: 'Vaccination Records', action: () => prisma.vaccinationRecord.deleteMany({}) },
    { name: 'Appointments', action: () => prisma.appointment.deleteMany({}) },
    { name: 'Children', action: () => prisma.child.deleteMany({}) },
    { name: 'Parents', action: () => prisma.parent.deleteMany({}) },
    { name: 'Medical Staff', action: () => prisma.medicalStaff.deleteMany({}) },
  ];

  for (const op of operations) {
    const result = await op.action();
    console.log(`   ✓ ${op.name}: ${result.count} records deleted`);
  }

  console.log('\n   ⚠️  Admins preserved (not deleted)');
}

async function flushAppointments() {
  console.log('Deleting appointment-related data...\n');

  const operations = [
    { name: 'Vaccination Records', action: () => prisma.vaccinationRecord.deleteMany({}) },
    { name: 'Appointments', action: () => prisma.appointment.deleteMany({}) },
  ];

  for (const op of operations) {
    const result = await op.action();
    console.log(`   ✓ ${op.name}: ${result.count} records deleted`);
  }
}

async function flushKnowledge() {
  console.log('Deleting knowledge base...\n');

  const result = await prisma.knowledgeBase.deleteMany({});
  console.log(`   ✓ Knowledge Base: ${result.count} articles deleted`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
