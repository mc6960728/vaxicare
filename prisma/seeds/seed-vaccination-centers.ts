import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedVaccinationCenters() {
  console.log('🏥 Seeding Vaccination Centers...\n');

  const vaccinationCenters = [
    {
      name: 'Primary Health Center - Ahmedabad Central',
      address: 'CG Road, Near Parimal Garden',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380006',
      country: 'India',
      phone: '079-26577777',
      email: 'phc.ahmedabad.central@health.gov.in',
      licenseNumber: 'GUJ-PHC-AHM-001',
      openingHours: '9:00 AM - 6:00 PM (Mon-Sat)',
      facilities: 'Cold Storage, Emergency Care, Laboratory, Ambulance',
      isActive: true,
    },
    {
      name: 'Community Health Center - Satellite',
      address: 'Satellite Road, Opposite Jodhpur Cross Roads',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380015',
      country: 'India',
      phone: '079-26920000',
      email: 'chc.satellite@health.gov.in',
      licenseNumber: 'GUJ-CHC-SAT-002',
      openingHours: '8:00 AM - 8:00 PM (Mon-Sun)',
      facilities: 'Cold Storage, ICU, Laboratory, Pharmacy, Ambulance',
      isActive: true,
    },
    {
      name: 'Primary Health Center - Maninagar',
      address: 'Maninagar East, Near Railway Station',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380008',
      country: 'India',
      phone: '079-25462222',
      email: 'phc.maninagar@health.gov.in',
      licenseNumber: 'GUJ-PHC-MAN-003',
      openingHours: '9:00 AM - 6:00 PM (Mon-Sat)',
      facilities: 'Cold Storage, Laboratory, First Aid',
      isActive: true,
    },
    {
      name: 'Government Vaccination Center - Vastrapur',
      address: 'Vastrapur Lake Area, Near YMCA Club',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380015',
      country: 'India',
      phone: '079-26851111',
      email: 'gvc.vastrapur@health.gov.in',
      licenseNumber: 'GUJ-GVC-VAS-004',
      openingHours: '8:00 AM - 7:00 PM (Mon-Sat)',
      facilities: 'Cold Storage, Emergency Care, Laboratory, Pharmacy',
      isActive: true,
    },
    {
      name: 'Urban Health Center - Paldi',
      address: 'Paldi Char Rasta, Near HDFC Bank',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380007',
      country: 'India',
      phone: '079-26625555',
      email: 'uhc.paldi@health.gov.in',
      licenseNumber: 'GUJ-UHC-PAL-005',
      openingHours: '9:00 AM - 6:00 PM (Mon-Sat)',
      facilities: 'Cold Storage, Laboratory, Pediatric Care',
      isActive: true,
    },
    {
      name: 'Primary Health Center - Bopal',
      address: 'Bopal-Ghuma Road, Near Bopal Lake',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380058',
      country: 'India',
      phone: '079-29750000',
      email: 'phc.bopal@health.gov.in',
      licenseNumber: 'GUJ-PHC-BOP-006',
      openingHours: '9:00 AM - 5:00 PM (Mon-Sat)',
      facilities: 'Cold Storage, Laboratory, First Aid',
      isActive: true,
    },
    {
      name: 'Community Health Center - Naranpura',
      address: 'Naranpura Cross Roads, Near Vijay Cross Roads',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380013',
      country: 'India',
      phone: '079-27490000',
      email: 'chc.naranpura@health.gov.in',
      licenseNumber: 'GUJ-CHC-NAR-007',
      openingHours: '8:00 AM - 8:00 PM (Mon-Sun)',
      facilities: 'Cold Storage, Emergency Care, ICU, Laboratory, Ambulance',
      isActive: true,
    },
    {
      name: 'Primary Health Center - Nikol',
      address: 'Nikol Gam Road, Near Nikol Circle',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '382350',
      country: 'India',
      phone: '079-22810000',
      email: 'phc.nikol@health.gov.in',
      licenseNumber: 'GUJ-PHC-NIK-008',
      openingHours: '9:00 AM - 6:00 PM (Mon-Sat)',
      facilities: 'Cold Storage, Laboratory, Maternity Ward',
      isActive: true,
    },
    {
      name: 'Urban Health Center - Sabarmati',
      address: 'Sabarmati Riverfront, Near Ellis Bridge',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380005',
      country: 'India',
      phone: '079-26574444',
      email: 'uhc.sabarmati@health.gov.in',
      licenseNumber: 'GUJ-UHC-SAB-009',
      openingHours: '9:00 AM - 7:00 PM (Mon-Sat)',
      facilities: 'Cold Storage, Laboratory, Emergency Care, Pharmacy',
      isActive: true,
    },
    {
      name: 'Government Vaccination Center - Chandkheda',
      address: 'Chandkheda Main Road, Near BRTS Station',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '382424',
      country: 'India',
      phone: '079-23241111',
      email: 'gvc.chandkheda@health.gov.in',
      licenseNumber: 'GUJ-GVC-CHA-010',
      openingHours: '8:00 AM - 6:00 PM (Mon-Sat)',
      facilities: 'Cold Storage, Laboratory, First Aid, Ambulance',
      isActive: true,
    },
  ];

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const center of vaccinationCenters) {
      try {
        // Check if license number already exists
        const existing = await prisma.vaccinationCenter.findUnique({
          where: { licenseNumber: center.licenseNumber },
        });

        if (existing) {
          console.log(`⚠️  Skipped: ${center.name} (License number already exists)`);
          continue;
        }

        // Create vaccination center
        const created = await prisma.vaccinationCenter.create({
          data: center,
        });

        console.log(`✅ Created: ${created.name}`);
        console.log(`   📍 Location: ${created.address}, ${created.city}`);
        console.log(`   📞 Phone: ${created.phone}`);
        console.log(`   🆔 License: ${created.licenseNumber}\n`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to create: ${center.name}`);
        console.error(`   Error: ${error}\n`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully created: ${successCount} vaccination centers`);
    console.log(`❌ Failed: ${errorCount} vaccination centers`);
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('❌ Error seeding vaccination centers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedVaccinationCenters()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
