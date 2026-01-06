import { PrismaClient, StaffRole, Gender, EmploymentStatus, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedMedicalStaff() {
  console.log('👨‍⚕️ Seeding Medical Staff...\n');

  // First, get all vaccination centers to assign staff to them
  const vaccinationCenters = await prisma.vaccinationCenter.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  if (vaccinationCenters.length === 0) {
    console.log('❌ No vaccination centers found. Please run seed-vaccination-centers.ts first.');
    console.log('   Run: npx tsx prisma/seed-vaccination-centers.ts\n');
    await prisma.$disconnect();
    return;
  }

  console.log(`📍 Found ${vaccinationCenters.length} vaccination centers\n`);

  // Default password for all medical staff (should be changed on first login)
  const defaultPassword = await bcrypt.hash('Password@123', 10);

  // Medical staff data - Doctors, Nurses, and other staff
  const medicalStaffData = [
    // Doctors / Paediatricians
    {
      email: 'dr.rajesh.patel@vaxicare.in',
      password: defaultPassword,
      firstName: 'Rajesh',
      lastName: 'Patel',
      fullName: 'Dr. Rajesh Patel',
      dialCode: '+91',
      phone: '9876543201',
      dateOfBirth: new Date('1975-05-15'),
      gender: Gender.MALE,
      role: StaffRole.DOCTOR,
      specialization: 'Paediatrician',
      department: 'Pediatrics',
      licenseNumber: 'GUJ-MCI-DOC-001',
      licenseExpiryDate: new Date('2027-12-31'),
      experienceYears: 20,
      qualifications: 'MBBS, MD (Pediatrics), DCH',
      joiningDate: new Date('2020-01-15'),
      workingHours: '9:00 AM - 5:00 PM',
      currentShift: 'Morning',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'dr.priya.sharma@vaxicare.in',
      password: defaultPassword,
      firstName: 'Priya',
      lastName: 'Sharma',
      fullName: 'Dr. Priya Sharma',
      dialCode: '+91',
      phone: '9876543202',
      dateOfBirth: new Date('1982-08-22'),
      gender: Gender.FEMALE,
      role: StaffRole.DOCTOR,
      specialization: 'Paediatrician',
      department: 'Pediatrics',
      licenseNumber: 'GUJ-MCI-DOC-002',
      licenseExpiryDate: new Date('2026-06-30'),
      experienceYears: 15,
      qualifications: 'MBBS, DNB (Pediatrics)',
      joiningDate: new Date('2021-03-01'),
      workingHours: '10:00 AM - 6:00 PM',
      currentShift: 'Morning',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'dr.amit.desai@vaxicare.in',
      password: defaultPassword,
      firstName: 'Amit',
      lastName: 'Desai',
      fullName: 'Dr. Amit Desai',
      dialCode: '+91',
      phone: '9876543203',
      dateOfBirth: new Date('1978-11-10'),
      gender: Gender.MALE,
      role: StaffRole.DOCTOR,
      specialization: 'General Physician',
      department: 'General Medicine',
      licenseNumber: 'GUJ-MCI-DOC-003',
      licenseExpiryDate: new Date('2028-03-31'),
      experienceYears: 18,
      qualifications: 'MBBS, MD (General Medicine)',
      joiningDate: new Date('2019-06-15'),
      workingHours: '8:00 AM - 4:00 PM',
      currentShift: 'Morning',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'dr.meera.joshi@vaxicare.in',
      password: defaultPassword,
      firstName: 'Meera',
      lastName: 'Joshi',
      fullName: 'Dr. Meera Joshi',
      dialCode: '+91',
      phone: '9876543204',
      dateOfBirth: new Date('1985-03-25'),
      gender: Gender.FEMALE,
      role: StaffRole.DOCTOR,
      specialization: 'Paediatrician',
      department: 'Pediatrics',
      licenseNumber: 'GUJ-MCI-DOC-004',
      licenseExpiryDate: new Date('2027-09-30'),
      experienceYears: 12,
      qualifications: 'MBBS, MD (Pediatrics), Fellowship in Neonatology',
      joiningDate: new Date('2022-01-10'),
      workingHours: '2:00 PM - 10:00 PM',
      currentShift: 'Evening',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'dr.kiran.modi@vaxicare.in',
      password: defaultPassword,
      firstName: 'Kiran',
      lastName: 'Modi',
      fullName: 'Dr. Kiran Modi',
      dialCode: '+91',
      phone: '9876543205',
      dateOfBirth: new Date('1980-07-18'),
      gender: Gender.MALE,
      role: StaffRole.DOCTOR,
      specialization: 'Paediatrician',
      department: 'Pediatrics',
      licenseNumber: 'GUJ-MCI-DOC-005',
      licenseExpiryDate: new Date('2026-12-31'),
      experienceYears: 16,
      qualifications: 'MBBS, DCH, DNB (Pediatrics)',
      joiningDate: new Date('2020-08-01'),
      workingHours: '9:00 AM - 5:00 PM',
      currentShift: 'Morning',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    // Nurses
    {
      email: 'nurse.anita.patel@vaxicare.in',
      password: defaultPassword,
      firstName: 'Anita',
      lastName: 'Patel',
      fullName: 'Anita Patel',
      dialCode: '+91',
      phone: '9876543206',
      dateOfBirth: new Date('1990-02-14'),
      gender: Gender.FEMALE,
      role: StaffRole.NURSE,
      specialization: 'Pediatric Nursing',
      department: 'Nursing',
      licenseNumber: 'GUJ-NUR-001',
      licenseExpiryDate: new Date('2026-06-30'),
      experienceYears: 8,
      qualifications: 'B.Sc Nursing, Pediatric Nursing Certificate',
      joiningDate: new Date('2021-05-15'),
      workingHours: '8:00 AM - 4:00 PM',
      currentShift: 'Morning',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'nurse.sonal.shah@vaxicare.in',
      password: defaultPassword,
      firstName: 'Sonal',
      lastName: 'Shah',
      fullName: 'Sonal Shah',
      dialCode: '+91',
      phone: '9876543207',
      dateOfBirth: new Date('1988-09-05'),
      gender: Gender.FEMALE,
      role: StaffRole.NURSE,
      specialization: 'Immunization Specialist',
      department: 'Nursing',
      licenseNumber: 'GUJ-NUR-002',
      licenseExpiryDate: new Date('2027-03-31'),
      experienceYears: 10,
      qualifications: 'B.Sc Nursing, M.Sc Nursing (Community Health)',
      joiningDate: new Date('2020-02-01'),
      workingHours: '2:00 PM - 10:00 PM',
      currentShift: 'Evening',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'nurse.bhavna.trivedi@vaxicare.in',
      password: defaultPassword,
      firstName: 'Bhavna',
      lastName: 'Trivedi',
      fullName: 'Bhavna Trivedi',
      dialCode: '+91',
      phone: '9876543208',
      dateOfBirth: new Date('1992-12-20'),
      gender: Gender.FEMALE,
      role: StaffRole.NURSE,
      specialization: 'General Nursing',
      department: 'Nursing',
      licenseNumber: 'GUJ-NUR-003',
      licenseExpiryDate: new Date('2026-09-30'),
      experienceYears: 6,
      qualifications: 'GNM, Vaccination Training Certificate',
      joiningDate: new Date('2022-03-15'),
      workingHours: '8:00 AM - 4:00 PM',
      currentShift: 'Morning',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    // Pharmacists
    {
      email: 'pharm.nikhil.mehta@vaxicare.in',
      password: defaultPassword,
      firstName: 'Nikhil',
      lastName: 'Mehta',
      fullName: 'Nikhil Mehta',
      dialCode: '+91',
      phone: '9876543209',
      dateOfBirth: new Date('1987-06-12'),
      gender: Gender.MALE,
      role: StaffRole.PHARMACIST,
      specialization: 'Clinical Pharmacy',
      department: 'Pharmacy',
      licenseNumber: 'GUJ-PHA-001',
      licenseExpiryDate: new Date('2027-06-30'),
      experienceYears: 12,
      qualifications: 'B.Pharm, M.Pharm (Clinical Pharmacy)',
      joiningDate: new Date('2019-09-01'),
      workingHours: '9:00 AM - 6:00 PM',
      currentShift: 'Morning',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'pharm.deepa.gandhi@vaxicare.in',
      password: defaultPassword,
      firstName: 'Deepa',
      lastName: 'Gandhi',
      fullName: 'Deepa Gandhi',
      dialCode: '+91',
      phone: '9876543210',
      dateOfBirth: new Date('1991-04-08'),
      gender: Gender.FEMALE,
      role: StaffRole.PHARMACIST,
      specialization: 'Vaccine Storage & Handling',
      department: 'Pharmacy',
      licenseNumber: 'GUJ-PHA-002',
      licenseExpiryDate: new Date('2026-12-31'),
      experienceYears: 7,
      qualifications: 'B.Pharm, Cold Chain Management Certificate',
      joiningDate: new Date('2021-11-15'),
      workingHours: '10:00 AM - 7:00 PM',
      currentShift: 'Morning',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    // Lab Technicians
    {
      email: 'lab.rakesh.thakkar@vaxicare.in',
      password: defaultPassword,
      firstName: 'Rakesh',
      lastName: 'Thakkar',
      fullName: 'Rakesh Thakkar',
      dialCode: '+91',
      phone: '9876543211',
      dateOfBirth: new Date('1989-01-30'),
      gender: Gender.MALE,
      role: StaffRole.LAB_TECHNICIAN,
      specialization: 'Immunology',
      department: 'Laboratory',
      licenseNumber: 'GUJ-LAB-001',
      licenseExpiryDate: new Date('2027-03-31'),
      experienceYears: 9,
      qualifications: 'B.Sc MLT, DMLT',
      joiningDate: new Date('2020-04-01'),
      workingHours: '8:00 AM - 4:00 PM',
      currentShift: 'Morning',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    // Receptionists
    {
      email: 'recep.kavita.solanki@vaxicare.in',
      password: defaultPassword,
      firstName: 'Kavita',
      lastName: 'Solanki',
      fullName: 'Kavita Solanki',
      dialCode: '+91',
      phone: '9876543212',
      dateOfBirth: new Date('1994-08-17'),
      gender: Gender.FEMALE,
      role: StaffRole.RECEPTIONIST,
      specialization: 'Front Desk Management',
      department: 'Administration',
      licenseNumber: 'GUJ-REC-001',
      licenseExpiryDate: new Date('2030-12-31'),
      experienceYears: 5,
      qualifications: 'B.Com, Healthcare Administration Certificate',
      joiningDate: new Date('2022-06-01'),
      workingHours: '9:00 AM - 6:00 PM',
      currentShift: 'Morning',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'recep.harshad.prajapati@vaxicare.in',
      password: defaultPassword,
      firstName: 'Harshad',
      lastName: 'Prajapati',
      fullName: 'Harshad Prajapati',
      dialCode: '+91',
      phone: '9876543213',
      dateOfBirth: new Date('1993-11-25'),
      gender: Gender.MALE,
      role: StaffRole.RECEPTIONIST,
      specialization: 'Patient Coordination',
      department: 'Administration',
      licenseNumber: 'GUJ-REC-002',
      licenseExpiryDate: new Date('2030-12-31'),
      experienceYears: 4,
      qualifications: 'BBA, Medical Office Administration',
      joiningDate: new Date('2023-01-15'),
      workingHours: '2:00 PM - 10:00 PM',
      currentShift: 'Evening',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    // Administrators
    {
      email: 'admin.vikram.chauhan@vaxicare.in',
      password: defaultPassword,
      firstName: 'Vikram',
      lastName: 'Chauhan',
      fullName: 'Vikram Chauhan',
      dialCode: '+91',
      phone: '9876543214',
      dateOfBirth: new Date('1983-05-10'),
      gender: Gender.MALE,
      role: StaffRole.ADMINISTRATOR,
      specialization: 'Healthcare Administration',
      department: 'Administration',
      licenseNumber: 'GUJ-ADM-001',
      licenseExpiryDate: new Date('2030-12-31'),
      experienceYears: 14,
      qualifications: 'MBA (Hospital Administration), MHA',
      joiningDate: new Date('2018-07-01'),
      workingHours: '9:00 AM - 6:00 PM',
      currentShift: 'Morning',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    // Additional Doctors for other centers
    {
      email: 'dr.sunita.verma@vaxicare.in',
      password: defaultPassword,
      firstName: 'Sunita',
      lastName: 'Verma',
      fullName: 'Dr. Sunita Verma',
      dialCode: '+91',
      phone: '9876543215',
      dateOfBirth: new Date('1979-10-05'),
      gender: Gender.FEMALE,
      role: StaffRole.DOCTOR,
      specialization: 'Paediatrician',
      department: 'Pediatrics',
      licenseNumber: 'GUJ-MCI-DOC-006',
      licenseExpiryDate: new Date('2026-08-31'),
      experienceYears: 17,
      qualifications: 'MBBS, MD (Pediatrics), IAP Immunization Fellowship',
      joiningDate: new Date('2019-11-01'),
      workingHours: '9:00 AM - 5:00 PM',
      currentShift: 'Morning',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'dr.harsh.bhatt@vaxicare.in',
      password: defaultPassword,
      firstName: 'Harsh',
      lastName: 'Bhatt',
      fullName: 'Dr. Harsh Bhatt',
      dialCode: '+91',
      phone: '9876543216',
      dateOfBirth: new Date('1984-02-28'),
      gender: Gender.MALE,
      role: StaffRole.DOCTOR,
      specialization: 'Paediatrician',
      department: 'Pediatrics',
      licenseNumber: 'GUJ-MCI-DOC-007',
      licenseExpiryDate: new Date('2027-05-31'),
      experienceYears: 13,
      qualifications: 'MBBS, DCH, FIAP',
      joiningDate: new Date('2021-08-15'),
      workingHours: '10:00 AM - 6:00 PM',
      currentShift: 'Morning',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'dr.anjali.raval@vaxicare.in',
      password: defaultPassword,
      firstName: 'Anjali',
      lastName: 'Raval',
      fullName: 'Dr. Anjali Raval',
      dialCode: '+91',
      phone: '9876543217',
      dateOfBirth: new Date('1986-07-14'),
      gender: Gender.FEMALE,
      role: StaffRole.DOCTOR,
      specialization: 'Paediatrician',
      department: 'Pediatrics',
      licenseNumber: 'GUJ-MCI-DOC-008',
      licenseExpiryDate: new Date('2028-01-31'),
      experienceYears: 11,
      qualifications: 'MBBS, MD (Pediatrics)',
      joiningDate: new Date('2022-04-01'),
      workingHours: '8:00 AM - 4:00 PM',
      currentShift: 'Morning',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'dr.prakash.dave@vaxicare.in',
      password: defaultPassword,
      firstName: 'Prakash',
      lastName: 'Dave',
      fullName: 'Dr. Prakash Dave',
      dialCode: '+91',
      phone: '9876543218',
      dateOfBirth: new Date('1976-12-03'),
      gender: Gender.MALE,
      role: StaffRole.DOCTOR,
      specialization: 'Senior Paediatrician',
      department: 'Pediatrics',
      licenseNumber: 'GUJ-MCI-DOC-009',
      licenseExpiryDate: new Date('2026-04-30'),
      experienceYears: 22,
      qualifications: 'MBBS, MD (Pediatrics), MRCP (UK)',
      joiningDate: new Date('2018-01-15'),
      workingHours: '9:00 AM - 3:00 PM',
      currentShift: 'Morning',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'dr.nisha.pandya@vaxicare.in',
      password: defaultPassword,
      firstName: 'Nisha',
      lastName: 'Pandya',
      fullName: 'Dr. Nisha Pandya',
      dialCode: '+91',
      phone: '9876543219',
      dateOfBirth: new Date('1988-04-19'),
      gender: Gender.FEMALE,
      role: StaffRole.DOCTOR,
      specialization: 'Paediatrician',
      department: 'Pediatrics',
      licenseNumber: 'GUJ-MCI-DOC-010',
      licenseExpiryDate: new Date('2027-11-30'),
      experienceYears: 9,
      qualifications: 'MBBS, DNB (Pediatrics), Immunization Specialist',
      joiningDate: new Date('2023-02-01'),
      workingHours: '2:00 PM - 10:00 PM',
      currentShift: 'Evening',
      employmentStatus: EmploymentStatus.ACTIVE,
      status: UserStatus.ACTIVE,
    },
  ];

  try {
    let successCount = 0;
    let errorCount = 0;
    let centerIndex = 0;

    for (const staff of medicalStaffData) {
      try {
        // Check if email or phone or license number already exists
        const existingByEmail = await prisma.medicalStaff.findUnique({
          where: { email: staff.email },
        });
        const existingByPhone = await prisma.medicalStaff.findUnique({
          where: { phone: staff.phone },
        });
        const existingByLicense = await prisma.medicalStaff.findUnique({
          where: { licenseNumber: staff.licenseNumber },
        });

        if (existingByEmail || existingByPhone || existingByLicense) {
          console.log(`⚠️  Skipped: ${staff.fullName} (Already exists)`);
          continue;
        }

        // Assign to vaccination centers in round-robin fashion
        const assignedCenter = vaccinationCenters[centerIndex % vaccinationCenters.length];
        centerIndex++;

        // Create medical staff
        const created = await prisma.medicalStaff.create({
          data: {
            ...staff,
            clinicId: assignedCenter.id,
          },
        });

        console.log(`✅ Created: ${created.fullName}`);
        console.log(`   👔 Role: ${created.role} - ${created.specialization}`);
        console.log(`   📍 Center: ${assignedCenter.name}`);
        console.log(`   📧 Email: ${created.email}`);
        console.log(`   🆔 License: ${created.licenseNumber}\n`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to create: ${staff.fullName}`);
        console.error(`   Error: ${error}\n`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully created: ${successCount} medical staff members`);
    console.log(`❌ Failed: ${errorCount} medical staff members`);
    console.log('='.repeat(60));

    // Summary by role
    const summary = await prisma.medicalStaff.groupBy({
      by: ['role'],
      _count: { role: true },
      where: { status: 'ACTIVE', isDeleted: false },
    });

    console.log('\n📊 Staff Summary by Role:');
    for (const item of summary) {
      console.log(`   ${item.role}: ${item._count.role}`);
    }
    console.log('\n');

  } catch (error) {
    console.error('❌ Error seeding medical staff:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedMedicalStaff()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
