import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Complete Indian Vaccination Schedule - Vaccines Data
const vaccinesData = [
  // Birth Vaccines
  {
    name: 'BCG',
    manufacturer: 'Serum Institute of India',
    description: 'Bacillus Calmette-Guérin vaccine for tuberculosis protection',
    dosage: '0.1 ml intradermal',
    ageGroupLabel: 'Birth',
    dosageCount: 1,
    intervalBetweenDoses: null,
    price: 50.00,
    sideEffects: 'Small scar at injection site, mild swelling, mild fever',
    notes: 'Store at 2-8°C. Administer within 4 weeks of birth. Single dose vaccine.',
    isActive: true,
  },
  {
    name: 'Hepatitis B',
    manufacturer: 'Bharat Biotech',
    description: 'Protection against Hepatitis B virus',
    dosage: '0.5 ml intramuscular',
    ageGroupLabel: 'Birth, 6 Weeks, 6 Months',
    dosageCount: 3,
    intervalBetweenDoses: 42,
    price: 100.00,
    sideEffects: 'Mild fever, soreness at injection site, fatigue',
    notes: 'Store at 2-8°C. Three dose series. Very important for newborns.',
    isActive: true,
  },
  {
    name: 'OPV (Oral Polio)',
    manufacturer: 'Bio-Med',
    description: 'Oral Polio Vaccine for polio protection',
    dosage: '2 drops oral',
    ageGroupLabel: 'Birth, 6 Months, 9 Months',
    dosageCount: 3,
    intervalBetweenDoses: null,
    price: 30.00,
    sideEffects: 'Rarely mild diarrhea',
    notes: 'Oral vaccine. No injection. Part of pulse polio program.',
    isActive: true,
  },

  // 6 Weeks Vaccines
  {
    name: 'DTwP (DPT)',
    manufacturer: 'Serum Institute of India',
    description: 'Diphtheria, Tetanus, and Pertussis (whole cell) vaccine',
    dosage: '0.5 ml intramuscular',
    ageGroupLabel: '6 Weeks, 10 Weeks, 14 Weeks, 15-18 Months, 4-6 Years',
    dosageCount: 5,
    intervalBetweenDoses: 28,
    price: 80.00,
    sideEffects: 'Fever, fussiness, redness at injection site, swelling',
    notes: 'Store at 2-8°C. Five dose series. May cause mild fever - give paracetamol if needed.',
    isActive: true,
  },
  {
    name: 'IPV (Inactivated Polio)',
    manufacturer: 'Sanofi Pasteur',
    description: 'Inactivated Polio Vaccine',
    dosage: '0.5 ml intramuscular',
    ageGroupLabel: '6 Weeks, 10 Weeks, 14 Weeks, 15-18 Months',
    dosageCount: 4,
    intervalBetweenDoses: 28,
    price: 150.00,
    sideEffects: 'Soreness at injection site, mild fever',
    notes: 'Store at 2-8°C. Safer alternative to OPV. No risk of vaccine-derived polio.',
    isActive: true,
  },
  {
    name: 'Hib (Haemophilus Influenzae B)',
    manufacturer: 'GSK',
    description: 'Protection against Haemophilus influenzae type b',
    dosage: '0.5 ml intramuscular',
    ageGroupLabel: '6 Weeks, 10 Weeks, 14 Weeks, 15-18 Months',
    dosageCount: 4,
    intervalBetweenDoses: 28,
    price: 200.00,
    sideEffects: 'Mild fever, redness at injection site',
    notes: 'Store at 2-8°C. Prevents serious infections like meningitis and pneumonia.',
    isActive: true,
  },
  {
    name: 'PCV (Pneumococcal Conjugate)',
    manufacturer: 'Pfizer',
    description: 'Protection against pneumococcal diseases',
    dosage: '0.5 ml intramuscular',
    ageGroupLabel: '6 Weeks, 10 Weeks, 14 Weeks, 9-12 Months',
    dosageCount: 4,
    intervalBetweenDoses: 28,
    price: 350.00,
    sideEffects: 'Fever, loss of appetite, fussiness, injection site reactions',
    notes: 'Store at 2-8°C. Protects against pneumonia, meningitis, and ear infections.',
    isActive: true,
  },
  {
    name: 'Rotavirus',
    manufacturer: 'GSK',
    description: 'Protection against rotavirus gastroenteritis',
    dosage: '1.5 ml oral',
    ageGroupLabel: '6 Weeks, 10 Weeks, 14 Weeks',
    dosageCount: 3,
    intervalBetweenDoses: 28,
    price: 250.00,
    sideEffects: 'Mild diarrhea, vomiting, irritability',
    notes: 'Oral vaccine. Prevents severe diarrhea. Must complete series before 8 months.',
    isActive: true,
  },

  // 9-12 Months Vaccines
  {
    name: 'MMR (Measles, Mumps, Rubella)',
    manufacturer: 'Serum Institute of India',
    description: 'Protection against Measles, Mumps, and Rubella',
    dosage: '0.5 ml subcutaneous',
    ageGroupLabel: '9-12 Months, 15-18 Months',
    dosageCount: 2,
    intervalBetweenDoses: 180,
    price: 120.00,
    sideEffects: 'Mild fever, rash, swelling at injection site',
    notes: 'Store at 2-8°C. Two dose series. Very effective in preventing measles outbreaks.',
    isActive: true,
  },
  {
    name: 'Typhoid Conjugate Vaccine',
    manufacturer: 'Bharat Biotech',
    description: 'Protection against typhoid fever',
    dosage: '0.5 ml intramuscular',
    ageGroupLabel: '9-12 Months',
    dosageCount: 1,
    intervalBetweenDoses: null,
    price: 180.00,
    sideEffects: 'Fever, headache, injection site pain',
    notes: 'Store at 2-8°C. Single dose. Booster every 2-3 years if in endemic area.',
    isActive: true,
  },

  // 15-18 Months Vaccines
  {
    name: 'Varicella (Chickenpox)',
    manufacturer: 'GSK',
    description: 'Protection against chickenpox',
    dosage: '0.5 ml subcutaneous',
    ageGroupLabel: '15-18 Months',
    dosageCount: 1,
    intervalBetweenDoses: null,
    price: 300.00,
    sideEffects: 'Mild rash, fever, soreness at injection site',
    notes: 'Store at 2-8°C. Highly effective. May have mild chickenpox-like rash.',
    isActive: true,
  },

  // 18-24 Months Vaccines
  {
    name: 'Hepatitis A',
    manufacturer: 'GSK',
    description: 'Protection against Hepatitis A virus',
    dosage: '0.5 ml intramuscular',
    ageGroupLabel: '18-24 Months',
    dosageCount: 2,
    intervalBetweenDoses: 180,
    price: 220.00,
    sideEffects: 'Soreness at injection site, mild fever, fatigue',
    notes: 'Store at 2-8°C. Two dose series 6 months apart. Important for children in India.',
    isActive: true,
  },

  // 10-12 Years Vaccines
  {
    name: 'Tdap (Tetanus, Diphtheria, Pertussis)',
    manufacturer: 'Sanofi Pasteur',
    description: 'Booster for adolescents and adults',
    dosage: '0.5 ml intramuscular',
    ageGroupLabel: '10-12 Years',
    dosageCount: 1,
    intervalBetweenDoses: null,
    price: 150.00,
    sideEffects: 'Pain at injection site, headache, fatigue',
    notes: 'Store at 2-8°C. Booster dose. Lower dose of diphtheria and pertussis than DTwP.',
    isActive: true,
  },
  {
    name: 'HPV (Human Papillomavirus)',
    manufacturer: 'MSD',
    description: 'Protection against HPV and cervical cancer',
    dosage: '0.5 ml intramuscular',
    ageGroupLabel: '10-12 Years',
    dosageCount: 2,
    intervalBetweenDoses: 180,
    price: 400.00,
    sideEffects: 'Pain at injection site, headache, fatigue, dizziness',
    notes: 'Store at 2-8°C. Two or three dose series. Recommended for both boys and girls.',
    isActive: true,
  },
];

async function main() {
  console.log('🌱 Starting vaccines seed...\n');

  // Check if vaccines already exist
  const existingCount = await prisma.vaccine.count();
  if (existingCount > 0) {
    console.log(`⚠️  Found ${existingCount} existing vaccines.`);
    console.log('   Run flush-data.ts first if you want to reseed.\n');

    const args = process.argv.slice(2);
    if (!args.includes('--force')) {
      console.log('   Use --force flag to override: npx tsx prisma/seeds/seed-vaccines.ts --force\n');
      return;
    }

    console.log('   --force flag detected. Deleting existing data...\n');
    await prisma.vaccineSchedule.deleteMany({});
    await prisma.vaccine.deleteMany({});
  }

  console.log('📦 Creating vaccines...');

  const createdVaccines: { [key: string]: string } = {};

  for (const vaccine of vaccinesData) {
    const created = await prisma.vaccine.create({
      data: vaccine,
    });
    createdVaccines[vaccine.name] = created.id;
    console.log(`   ✓ ${vaccine.name}`);
  }

  console.log(`\n✅ Created ${vaccinesData.length} vaccines successfully!\n`);

  // Export vaccine IDs for schedule seeding
  console.log('📋 Vaccine IDs (for reference):');
  for (const [name, id] of Object.entries(createdVaccines)) {
    console.log(`   ${name}: ${id}`);
  }

  console.log('\n✨ Vaccines seed completed!');
  console.log('💡 Next: Run seed-vaccine-schedules.ts to add schedules\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
