import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Schedule data - references vaccine by name, will be linked by ID at runtime
const schedulesData = [
  // ============================================
  // BIRTH (0 days)
  // ============================================
  { vaccineName: 'BCG', ageGroupLabel: 'Birth', ageInDays: 0, ageInMonths: 0, doseNumber: 1, displayOrder: 1, isRequired: true, description: 'Single dose at birth to protect against tuberculosis' },
  { vaccineName: 'Hepatitis B', ageGroupLabel: 'Birth', ageInDays: 0, ageInMonths: 0, doseNumber: 1, displayOrder: 2, isRequired: true, description: 'First dose within 24 hours of birth' },
  { vaccineName: 'OPV (Oral Polio)', ageGroupLabel: 'Birth', ageInDays: 0, ageInMonths: 0, doseNumber: 0, displayOrder: 3, isRequired: true, description: 'Birth dose (zero dose)' },

  // ============================================
  // 6 WEEKS (42 days)
  // ============================================
  { vaccineName: 'DTwP (DPT)', ageGroupLabel: '6 Weeks', ageInDays: 42, ageInMonths: 1.5, doseNumber: 1, displayOrder: 1, isRequired: true, description: 'First dose of DPT vaccine' },
  { vaccineName: 'IPV (Inactivated Polio)', ageGroupLabel: '6 Weeks', ageInDays: 42, ageInMonths: 1.5, doseNumber: 1, displayOrder: 2, isRequired: true, description: 'First dose of inactivated polio vaccine' },
  { vaccineName: 'Hib (Haemophilus Influenzae B)', ageGroupLabel: '6 Weeks', ageInDays: 42, ageInMonths: 1.5, doseNumber: 1, displayOrder: 3, isRequired: true, description: 'First dose of Hib vaccine' },
  { vaccineName: 'Hepatitis B', ageGroupLabel: '6 Weeks', ageInDays: 42, ageInMonths: 1.5, doseNumber: 2, displayOrder: 4, isRequired: true, description: 'Second dose at 6 weeks' },
  { vaccineName: 'PCV (Pneumococcal Conjugate)', ageGroupLabel: '6 Weeks', ageInDays: 42, ageInMonths: 1.5, doseNumber: 1, displayOrder: 5, isRequired: true, description: 'First dose of pneumococcal vaccine' },
  { vaccineName: 'Rotavirus', ageGroupLabel: '6 Weeks', ageInDays: 42, ageInMonths: 1.5, doseNumber: 1, displayOrder: 6, isRequired: true, description: 'First dose of rotavirus vaccine (oral)' },

  // ============================================
  // 10 WEEKS (70 days)
  // ============================================
  { vaccineName: 'DTwP (DPT)', ageGroupLabel: '10 Weeks', ageInDays: 70, ageInMonths: 2.5, doseNumber: 2, displayOrder: 1, isRequired: true, description: 'Second dose of DPT vaccine' },
  { vaccineName: 'IPV (Inactivated Polio)', ageGroupLabel: '10 Weeks', ageInDays: 70, ageInMonths: 2.5, doseNumber: 2, displayOrder: 2, isRequired: true, description: 'Second dose of inactivated polio vaccine' },
  { vaccineName: 'Hib (Haemophilus Influenzae B)', ageGroupLabel: '10 Weeks', ageInDays: 70, ageInMonths: 2.5, doseNumber: 2, displayOrder: 3, isRequired: true, description: 'Second dose of Hib vaccine' },
  { vaccineName: 'PCV (Pneumococcal Conjugate)', ageGroupLabel: '10 Weeks', ageInDays: 70, ageInMonths: 2.5, doseNumber: 2, displayOrder: 4, isRequired: true, description: 'Second dose of pneumococcal vaccine' },
  { vaccineName: 'Rotavirus', ageGroupLabel: '10 Weeks', ageInDays: 70, ageInMonths: 2.5, doseNumber: 2, displayOrder: 5, isRequired: true, description: 'Second dose of rotavirus vaccine (oral)' },

  // ============================================
  // 14 WEEKS (98 days)
  // ============================================
  { vaccineName: 'DTwP (DPT)', ageGroupLabel: '14 Weeks', ageInDays: 98, ageInMonths: 3.5, doseNumber: 3, displayOrder: 1, isRequired: true, description: 'Third dose of DPT vaccine' },
  { vaccineName: 'IPV (Inactivated Polio)', ageGroupLabel: '14 Weeks', ageInDays: 98, ageInMonths: 3.5, doseNumber: 3, displayOrder: 2, isRequired: true, description: 'Third dose of inactivated polio vaccine' },
  { vaccineName: 'Hib (Haemophilus Influenzae B)', ageGroupLabel: '14 Weeks', ageInDays: 98, ageInMonths: 3.5, doseNumber: 3, displayOrder: 3, isRequired: true, description: 'Third dose of Hib vaccine' },
  { vaccineName: 'PCV (Pneumococcal Conjugate)', ageGroupLabel: '14 Weeks', ageInDays: 98, ageInMonths: 3.5, doseNumber: 3, displayOrder: 4, isRequired: true, description: 'Third dose of pneumococcal vaccine' },
  { vaccineName: 'Rotavirus', ageGroupLabel: '14 Weeks', ageInDays: 98, ageInMonths: 3.5, doseNumber: 3, displayOrder: 5, isRequired: true, description: 'Third dose of rotavirus vaccine (oral)' },

  // ============================================
  // 6 MONTHS (180 days)
  // ============================================
  { vaccineName: 'OPV (Oral Polio)', ageGroupLabel: '6 Months', ageInDays: 180, ageInMonths: 6, doseNumber: 1, displayOrder: 1, isRequired: true, description: 'First booster dose of OPV' },
  { vaccineName: 'Hepatitis B', ageGroupLabel: '6 Months', ageInDays: 180, ageInMonths: 6, doseNumber: 3, displayOrder: 2, isRequired: true, description: 'Third and final dose of Hepatitis B' },

  // ============================================
  // 9-12 MONTHS (270 days)
  // ============================================
  { vaccineName: 'MMR (Measles, Mumps, Rubella)', ageGroupLabel: '9-12 Months', ageInDays: 270, ageInMonths: 9, doseNumber: 1, displayOrder: 1, isRequired: true, description: 'First dose of MMR vaccine' },
  { vaccineName: 'OPV (Oral Polio)', ageGroupLabel: '9-12 Months', ageInDays: 270, ageInMonths: 9, doseNumber: 2, displayOrder: 2, isRequired: true, description: 'Second booster dose of OPV' },
  { vaccineName: 'Typhoid Conjugate Vaccine', ageGroupLabel: '9-12 Months', ageInDays: 270, ageInMonths: 9, doseNumber: 1, displayOrder: 3, isRequired: true, description: 'Single dose of Typhoid conjugate vaccine' },
  { vaccineName: 'PCV (Pneumococcal Conjugate)', ageGroupLabel: '9-12 Months', ageInDays: 270, ageInMonths: 9, doseNumber: 4, displayOrder: 4, isRequired: true, description: 'Booster dose of pneumococcal vaccine' },

  // ============================================
  // 15-18 MONTHS (450 days)
  // ============================================
  { vaccineName: 'MMR (Measles, Mumps, Rubella)', ageGroupLabel: '15-18 Months', ageInDays: 450, ageInMonths: 15, doseNumber: 2, displayOrder: 1, isRequired: true, description: 'Second dose of MMR vaccine' },
  { vaccineName: 'Varicella (Chickenpox)', ageGroupLabel: '15-18 Months', ageInDays: 450, ageInMonths: 15, doseNumber: 1, displayOrder: 2, isRequired: true, description: 'Single dose of chickenpox vaccine' },
  { vaccineName: 'DTwP (DPT)', ageGroupLabel: '15-18 Months', ageInDays: 450, ageInMonths: 15, doseNumber: 4, displayOrder: 3, isRequired: true, description: 'First booster dose of DPT' },
  { vaccineName: 'IPV (Inactivated Polio)', ageGroupLabel: '15-18 Months', ageInDays: 450, ageInMonths: 15, doseNumber: 4, displayOrder: 4, isRequired: true, description: 'Booster dose of IPV' },
  { vaccineName: 'Hib (Haemophilus Influenzae B)', ageGroupLabel: '15-18 Months', ageInDays: 450, ageInMonths: 15, doseNumber: 4, displayOrder: 5, isRequired: true, description: 'Booster dose of Hib' },

  // ============================================
  // 18-24 MONTHS (540-720 days)
  // ============================================
  { vaccineName: 'Hepatitis A', ageGroupLabel: '18-24 Months', ageInDays: 540, ageInMonths: 18, doseNumber: 1, displayOrder: 1, isRequired: true, description: 'First dose of Hepatitis A' },
  { vaccineName: 'Hepatitis A', ageGroupLabel: '24 Months', ageInDays: 720, ageInMonths: 24, doseNumber: 2, displayOrder: 1, isRequired: true, description: 'Second dose of Hepatitis A (6 months after first dose)' },

  // ============================================
  // 4-6 YEARS (1825 days)
  // ============================================
  { vaccineName: 'DTwP (DPT)', ageGroupLabel: '4-6 Years', ageInDays: 1825, ageInMonths: 60, doseNumber: 5, displayOrder: 1, isRequired: true, description: 'Second booster dose of DPT before school entry' },
  { vaccineName: 'OPV (Oral Polio)', ageGroupLabel: '4-6 Years', ageInDays: 1825, ageInMonths: 60, doseNumber: 3, displayOrder: 2, isRequired: true, description: 'Final booster dose of OPV' },

  // ============================================
  // 10-12 YEARS (3650 days)
  // ============================================
  { vaccineName: 'Tdap (Tetanus, Diphtheria, Pertussis)', ageGroupLabel: '10-12 Years', ageInDays: 3650, ageInMonths: 120, doseNumber: 1, displayOrder: 1, isRequired: true, description: 'Booster dose for adolescents' },
  { vaccineName: 'HPV (Human Papillomavirus)', ageGroupLabel: '10-12 Years', ageInDays: 3650, ageInMonths: 120, doseNumber: 1, displayOrder: 2, isRequired: true, description: 'First dose of HPV vaccine (9-14 years: 2 dose series)' },
  { vaccineName: 'HPV (Human Papillomavirus)', ageGroupLabel: '11-13 Years', ageInDays: 4015, ageInMonths: 132, doseNumber: 2, displayOrder: 1, isRequired: true, description: 'Second dose of HPV vaccine (6 months after first dose)' },
];

async function main() {
  console.log('🌱 Starting vaccine schedules seed...\n');

  // Get all vaccines
  const vaccines = await prisma.vaccine.findMany();
  if (vaccines.length === 0) {
    console.error('❌ No vaccines found! Run seed-vaccines.ts first.\n');
    console.log('   npx tsx prisma/seeds/seed-vaccines.ts\n');
    process.exit(1);
  }

  // Create vaccine name to ID map
  const vaccineMap: { [key: string]: string } = {};
  for (const vaccine of vaccines) {
    vaccineMap[vaccine.name] = vaccine.id;
  }

  console.log(`📋 Found ${vaccines.length} vaccines\n`);

  // Check if schedules already exist
  const existingCount = await prisma.vaccineSchedule.count();
  if (existingCount > 0) {
    console.log(`⚠️  Found ${existingCount} existing schedules.`);

    const args = process.argv.slice(2);
    if (!args.includes('--force')) {
      console.log('   Use --force flag to override: npx tsx prisma/seeds/seed-vaccine-schedules.ts --force\n');
      return;
    }

    console.log('   --force flag detected. Deleting existing schedules...\n');
    await prisma.vaccineSchedule.deleteMany({});
  }

  console.log('📅 Creating vaccine schedules...\n');

  let created = 0;
  let skipped = 0;

  for (const schedule of schedulesData) {
    const vaccineId = vaccineMap[schedule.vaccineName];

    if (!vaccineId) {
      console.log(`   ⚠️  Skipping: ${schedule.vaccineName} (vaccine not found)`);
      skipped++;
      continue;
    }

    await prisma.vaccineSchedule.create({
      data: {
        vaccineId,
        vaccineName: schedule.vaccineName,
        ageGroupLabel: schedule.ageGroupLabel,
        ageInDays: schedule.ageInDays,
        ageInMonths: schedule.ageInMonths,
        doseNumber: schedule.doseNumber,
        displayOrder: schedule.displayOrder,
        isRequired: schedule.isRequired,
        description: schedule.description,
      },
    });

    created++;
  }

  console.log(`\n✅ Created ${created} vaccine schedules`);
  if (skipped > 0) {
    console.log(`⚠️  Skipped ${skipped} schedules (vaccines not found)`);
  }

  // Show summary by age group
  console.log('\n📊 Summary by Age Group:');
  const summary = await prisma.vaccineSchedule.groupBy({
    by: ['ageGroupLabel'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  for (const group of summary) {
    console.log(`   ${group.ageGroupLabel}: ${group._count.id} vaccines`);
  }

  console.log('\n✨ Vaccine schedules seed completed!');
  console.log('💡 Next: Run seed-knowledge-base.ts to add articles\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
