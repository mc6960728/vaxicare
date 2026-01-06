import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  organization: z.string().min(1, 'Organization is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  fcmToken: z.string().optional(),
  deviceType: z.string().optional(),
});

// Admin Signup Schema
export const adminSignupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  organization: z.string().min(1, 'Organization name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


export const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  organization: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// OTP Authentication Validation Schemas
export const sendOtpSchema = z.object({
  dialCode: z.string().min(1, 'Dial code is required').default('+91'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  appType: z.enum(['parent', 'staff'], {
    errorMap: () => ({ message: 'App type must be either "parent" or "staff"' }),
  }),
});

export const loginWithPhoneSchema = z.object({
  dialCode: z.string().min(1, 'Dial code is required').default('+91'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  appType: z.enum(['parent', 'staff'], {
    errorMap: () => ({ message: 'App type must be either "parent" or "staff"' }),
  }),
  fcmToken: z.string().optional(),
  deviceType: z.string().optional(),
});

export const registerParentSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  dialCode: z.string().min(1, 'Dial code is required').default('+91'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  email: z.string().email('Invalid email address'),
  relationWithChild: z.enum(['Father', 'Mother', 'Guardian'], {
    errorMap: () => ({ message: 'Relation must be Father, Mother, or Guardian' }),
  }),
});

export const registerMedicalStaffSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  dialCode: z.string().min(1, 'Dial code is required').default('+91'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  email: z.string().email('Invalid email address'),
  licenseNumber: z.string().min(1, 'License number is required'),
  specialization: z.string().optional(),
  experienceYears: z.number().min(0).optional(),
});


// District Validation Schemas
export const createDistrictSchema = z.object({
  name: z.string().min(1, 'District name is required'),
  state: z.string().optional().default('Gujarat'),
  districtCode: z.string().min(1, 'District code is required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  officeAddress: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
  notes: z.string().optional(),
});

export const updateDistrictSchema = z.object({
  name: z.string().min(1, 'District name is required').optional(),
  state: z.string().optional(),
  districtCode: z.string().min(1, 'District code is required').optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  officeAddress: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
  notes: z.string().optional(),
});

// Taluka Validation Schemas
export const createTalukaSchema = z.object({
  name: z.string().min(1, 'Taluka name is required'),
  districtId: z.string().uuid('Invalid district ID'),
  talukaCode: z.string().min(1, 'Taluka code is required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  officeAddress: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
  notes: z.string().optional(),
});

export const updateTalukaSchema = z.object({
  name: z.string().min(1, 'Taluka name is required').optional(),
  districtId: z.string().uuid('Invalid district ID').optional(),
  talukaCode: z.string().min(1, 'Taluka code is required').optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  officeAddress: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
  notes: z.string().optional(),
});

// Village Validation Schemas
export const createVillageSchema = z.object({
  name: z.string().min(1, 'Village name is required'),
  talukaId: z.string().uuid('Invalid taluka ID'),
  districtId: z.string().uuid('Invalid district ID'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  officeAddress: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
  notes: z.string().optional(),
});

export const updateVillageSchema = z.object({
  name: z.string().min(1, 'Village name is required').optional(),
  talukaId: z.string().uuid('Invalid taluka ID').optional(),
  districtId: z.string().uuid('Invalid district ID').optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  officeAddress: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
  notes: z.string().optional(),
});

// Parent Validation Schemas
export const createParentSchema = z.object({
  // Personal Info
  parentName: z.string().min(1, 'Parent name is required'),
  age: z.number().min(1).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']).optional(),
  numberOfChildren: z.number().min(1).optional(),
  relationWithChild: z.string().optional(),
  profilePhoto: z.string().optional(),

  // Contact & Address
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  dialCode: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),

  // Medical & Notes
  registrationDate: z.string().optional(),
  registrationTime: z.string().optional(),
  lastVisitDate: z.string().optional(),
  lastVisitTime: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  medicalHistory: z.string().optional(),
  notes: z.string().optional(),
});

export const updateParentSchema = z.object({
  // Personal Info
  parentName: z.string().min(1, 'Parent name is required').optional(),
  age: z.number().min(18, 'Age must be at least 18').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']).optional(),
  numberOfChildren: z.number().min(1).optional(),
  relationWithChild: z.string().optional(),
  profilePhoto: z.string().optional(),

  // Contact & Address
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  dialCode: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),

  // Medical & Notes
  registrationDate: z.string().optional(),
  registrationTime: z.string().optional(),
  lastVisitDate: z.string().optional(),
  lastVisitTime: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  medicalHistory: z.string().optional(),
  notes: z.string().optional(),
});

// Medical Staff Validation Schemas
export const createMedicalStaffSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  role: z.enum(['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'OTHER']),
  specialization: z.string().optional(),
  department: z.string().optional(),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseExpiryDate: z.string().optional(),
  experienceYears: z.number().min(0).optional(),
  qualifications: z.string().optional(),
  clinicId: z.string().uuid('Invalid vaccination center ID').optional(),
  joiningDate: z.string().optional(),
  salary: z.number().min(0).optional(),
  workingHours: z.string().optional(),
  employmentStatus: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'RESIGNED']).optional(),
  isAvailable: z.boolean().optional(),
});

export const updateMedicalStaffSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  role: z.enum(['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'OTHER']).optional(),
  specialization: z.string().optional(),
  department: z.string().optional(),
  licenseNumber: z.string().min(1, 'License number is required').optional(),
  licenseExpiryDate: z.string().optional(),
  experienceYears: z.number().min(0).optional(),
  qualifications: z.string().optional(),
  clinicId: z.string().uuid('Invalid vaccination center ID').optional(),
  joiningDate: z.string().optional(),
  salary: z.number().min(0).optional(),
  workingHours: z.string().optional(),
  employmentStatus: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'RESIGNED']).optional(),
  isAvailable: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']).optional(),
});

// Child Validation Schemas
export const addChildSchema = z.object({
  name: z.string().optional().default(""),
  dateOfBirth: z.string()
    .min(1, 'Date of birth is required')
    .refine((date) => {
      const dob = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      return dob <= today;
    }, {
      message: 'Date of birth cannot be in the future',
    })
    .refine((date) => {
      const dob = new Date(date);
      const maxAge = new Date();
      maxAge.setFullYear(maxAge.getFullYear() - 18); // Maximum 18 years old
      return dob >= maxAge;
    }, {
      message: 'Child must be under 18 years old',
    }),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    errorMap: () => ({ message: 'Gender must be MALE, FEMALE, or OTHER' }),
  }),
  profilePhoto: z.string().optional(),
  weightKg: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive('Weight must be positive').optional()
  ),
  heightCm: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive('Height must be positive').optional()
  ),
  bloodGroup: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']).optional(),
  allergies: z.array(z.string()).optional().default([]),
  pediatrician: z.string().optional(),
  medicalConditions: z.array(z.string()).optional().default([]),
  specialNotes: z.string().optional(),
});

export const updateChildSchema = z.object({
  name: z.string().optional(),
  dateOfBirth: z.string()
    .optional()
    .refine((date) => {
      if (!date) return true; // Skip validation if not provided
      const dob = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dob <= today;
    }, {
      message: 'Date of birth cannot be in the future',
    })
    .refine((date) => {
      if (!date) return true;
      const dob = new Date(date);
      const maxAge = new Date();
      maxAge.setFullYear(maxAge.getFullYear() - 18);
      return dob >= maxAge;
    }, {
      message: 'Child must be under 18 years old',
    }),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  profilePhoto: z.string().optional(),
  weightKg: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive('Weight must be positive').optional()
  ),
  heightCm: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive('Height must be positive').optional()
  ),
  bloodGroup: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']).optional(),
  allergies: z.array(z.string()).optional(),
  pediatrician: z.string().optional(),
  medicalConditions: z.array(z.string()).optional(),
  specialNotes: z.string().optional(),
});

// Edit Profile Validation Schemas
export const updateParentProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  dialCode: z.string().min(1, 'Dial code is required').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  relationWithChild: z.enum(['Father', 'Mother', 'Guardian'], {
    errorMap: () => ({ message: 'Relation must be Father, Mother, or Guardian' }),
  }).optional(),
  profilePhoto: z.string().url('Invalid profile photo URL').optional(),
});

export const updateMedicalStaffProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  dialCode: z.string().min(1, 'Dial code is required').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  licenseNumber: z.string().min(1, 'License number is required').optional(),
  specialization: z.string().optional(),
  experienceYears: z.number().min(0, 'Experience years must be non-negative').optional(),
  profilePhoto: z.string().url('Invalid profile photo URL').optional(),
});

// Vaccine Validation Schemas
export const createVaccineSchema = z.object({
  // Basic Info
  name: z.string().min(1, 'Vaccine name is required'),
  // manufacturer: z.string().min(1, 'Manufacturer is required'),
  supplierId: z.string().optional(),
  batchNumber: z.string().optional(),
  description: z.string().optional(),

  // Vaccine Type & Administration
  vaccineType: z.enum(['ORAL_DROPS', 'INJECTABLE', 'ORAL_SOLUTION', 'NASAL_SPRAY']).optional(),
  administrationRoute: z.enum(['ORAL', 'INTRAMUSCULAR', 'SUBCUTANEOUS', 'INTRADERMAL', 'NASAL']).optional(),
  vialType: z.enum(['SINGLE_DOSE', 'MULTI_DOSE', 'PRE_FILLED']).optional(),
  category: z.enum(['UIP', 'OPTIONAL', 'TRAVEL', 'SEASONAL']).optional(),

  // Dosage Information
  dosage: z.string().optional(),
  dosageUnit: z.string().optional(),
  dosagePerChild: z.number().min(0).optional(),
  dosesPerVial: z.number().min(0).optional(),
  childrenPerVial: z.number().min(0).optional(),

  // Age Group
  ageGroupLabel: z.string().optional(),

  // Schedule
  dosageCount: z.number().min(1, 'Dosage count must be at least 1').optional(),
  intervalBetweenDoses: z.number().min(0).optional(),
  boosterRequired: z.boolean().optional(),
  boosterIntervalDays: z.number().min(0).optional(),

  // Storage & Handling
  storageTemperatureMin: z.number().optional(),
  storageTemperatureMax: z.number().optional(),
  storageInstructions: z.string().optional(),
  diluentRequired: z.boolean().optional(),
  diluentName: z.string().optional(),

  // Open Vial Policy
  openVialPolicyHours: z.number().min(0).optional(),
  openVialPolicyDays: z.number().min(0).optional(),
  discardAfterOpening: z.boolean().optional(),

  // Contraindications & Precautions
  contraindications: z.array(z.string()).optional(),
  precautions: z.array(z.string()).optional(),
  sideEffects: z.string().optional(),
  adverseReactions: z.string().optional(),

  // Additional Info
  diseasesPrevented: z.array(z.string()).optional(),
  vaccineCode: z.string().optional(),
  whoPrequalified: z.boolean().optional(),
  nipGuidelines: z.string().optional(),

  // Meta
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateVaccineSchema = z.object({
  // Basic Info
  name: z.string().min(1, 'Vaccine name is required').optional(),
  // manufacturer: z.string().min(1, 'Manufacturer is required').optional(),
  supplierId: z.string().optional(),
  batchNumber: z.string().optional(),
  description: z.string().optional(),

  // Vaccine Type & Administration
  vaccineType: z.enum(['ORAL_DROPS', 'INJECTABLE', 'ORAL_SOLUTION', 'NASAL_SPRAY']).optional(),
  administrationRoute: z.enum(['ORAL', 'INTRAMUSCULAR', 'SUBCUTANEOUS', 'INTRADERMAL', 'NASAL']).optional(),
  vialType: z.enum(['SINGLE_DOSE', 'MULTI_DOSE', 'PRE_FILLED']).optional(),
  category: z.enum(['UIP', 'OPTIONAL', 'TRAVEL', 'SEASONAL']).optional(),

  // Dosage Information
  dosage: z.string().optional(),
  dosageUnit: z.string().optional(),
  dosagePerChild: z.number().min(0).optional(),
  dosesPerVial: z.number().min(0).optional(),
  childrenPerVial: z.number().min(0).optional(),

  // Age Group
  ageGroupLabel: z.string().optional(),

  // Schedule
  dosageCount: z.number().min(1, 'Dosage count must be at least 1').optional(),
  intervalBetweenDoses: z.number().min(0).optional(),
  boosterRequired: z.boolean().optional(),
  boosterIntervalDays: z.number().min(0).optional(),

  // Storage & Handling
  storageTemperatureMin: z.number().optional(),
  storageTemperatureMax: z.number().optional(),
  storageInstructions: z.string().optional(),
  diluentRequired: z.boolean().optional(),
  diluentName: z.string().optional(),

  // Open Vial Policy
  openVialPolicyHours: z.number().min(0).optional(),
  openVialPolicyDays: z.number().min(0).optional(),
  discardAfterOpening: z.boolean().optional(),

  // Contraindications & Precautions
  contraindications: z.array(z.string()).optional(),
  precautions: z.array(z.string()).optional(),
  sideEffects: z.string().optional(),
  adverseReactions: z.string().optional(),

  // Additional Info
  diseasesPrevented: z.array(z.string()).optional(),
  vaccineCode: z.string().optional(),
  whoPrequalified: z.boolean().optional(),
  nipGuidelines: z.string().optional(),

  // Meta
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Vaccine Schedule Validation Schemas
export const createVaccineScheduleSchema = z.object({
  vaccineId: z.string().min(1, 'Vaccine ID is required'),
  vaccineName: z.string().min(1, 'Vaccine name is required'),
  ageGroupLabel: z.string().min(1, 'Age group label is required'),
  ageInDays: z.number().min(0, 'Age in days must be non-negative'),
  ageInMonths: z.number().min(0).optional(),
  doseNumber: z.number().min(1, 'Dose number must be at least 1'),
  displayOrder: z.number().min(1, 'Display order must be at least 1'),
  isRequired: z.boolean().optional(),
  description: z.string().optional(),
});

export const updateVaccineScheduleSchema = z.object({
  vaccineName: z.string().min(1, 'Vaccine name is required').optional(),
  ageGroupLabel: z.string().min(1, 'Age group label is required').optional(),
  ageInDays: z.number().min(0, 'Age in days must be non-negative').optional(),
  ageInMonths: z.number().min(0).optional(),
  doseNumber: z.number().min(1, 'Dose number must be at least 1').optional(),
  displayOrder: z.number().min(1, 'Display order must be at least 1').optional(),
  isRequired: z.boolean().optional(),
  description: z.string().optional(),
});

// Vaccination Record Validation Schemas
export const markVaccinationCompleteSchema = z.object({
  administeredDate: z.string().optional(), // Optional - defaults to today if not provided
  reactions: z.string().optional(),
  notes: z.string().optional(),
  appointmentId: z.string().uuid('Invalid appointment ID').optional(), // NEW: Link to appointment if completed after appointment
  source: z.enum(['PARENT_REGISTRATION', 'APPOINTMENT_COMPLETION']).optional(), // NEW: Track source of completion
});

// Vaccination Center Validation Schemas
export const createVaccinationCenterSchema = z.object({
  name: z.string().min(1, 'Center name is required'),
  address: z.string().optional(),
  districtId: z.string().uuid('Invalid district ID').optional(),
  talukaId: z.string().uuid('Invalid taluka ID').optional(),
  villageId: z.string().uuid('Invalid village ID').optional(),
  pincode: z.string().min(6, 'Pincode must be at least 6 characters').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  licenseNumber: z.string().min(1, 'License number is required'),
  openingHours: z.string().optional(),
  facilities: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  notes: z.string().optional(),
});

export const updateVaccinationCenterSchema = z.object({
  name: z.string().min(1, 'Center name is required').optional(),
  address: z.string().optional(),
  districtId: z.string().uuid('Invalid district ID').optional().nullable(),
  talukaId: z.string().uuid('Invalid taluka ID').optional().nullable(),
  villageId: z.string().uuid('Invalid village ID').optional().nullable(),
  pincode: z.string().min(6, 'Pincode must be at least 6 characters').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  licenseNumber: z.string().min(1, 'License number is required').optional(),
  openingHours: z.string().optional(),
  facilities: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  notes: z.string().optional(),
});

// Vaccine Inventory Validation Schemas (Stock Management)
export const createVaccineInventorySchema = z.object({
  vaccineId: z.string().uuid('Invalid vaccine ID'),
  clinicId: z.string().uuid('Invalid vaccination center ID'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  quantity: z.number().int('Quantity must be an integer').min(0, 'Quantity cannot be negative'),
  costPerUnit: z.number().positive('Cost per unit must be positive').optional(),
  manufacturingDate: z.string().optional(),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  supplier: z.string().optional(),
  storageLocation: z.string().optional(),
  temperature: z.string().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'LOW_STOCK', 'OUT_OF_STOCK', 'QUARANTINE'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }).optional(),
  notes: z.string().optional(),
  dosageInVial: z.number().min(0).optional()
});

export const updateVaccineInventorySchema = z.object({
  batchNumber: z.string().min(1, 'Batch number is required').optional(),
  quantity: z.number().int('Quantity must be an integer').min(0, 'Quantity cannot be negative').optional(),
  costPerUnit: z.number().positive('Cost per unit must be positive').optional(),
  manufacturingDate: z.string().optional(),
  expiryDate: z.string().optional(),
  supplier: z.string().optional(),
  storageLocation: z.string().optional(),
  temperature: z.string().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'LOW_STOCK', 'OUT_OF_STOCK', 'QUARANTINE'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }).optional(),
  notes: z.string().optional(),
  dosageInVial: z.number().min(0).optional()
});

// Supplier Validation Schemas
export const createSupplierSchema = z.object({
  // Basic Info
  supplierName: z.string().min(1, 'Supplier name is required'),
  fullName: z.string().min(1, 'Contact person name is required'),
  supplierCode: z.string().min(1, 'Supplier code is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
  website: z.string().optional(),
  rating: z.string().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'LOW_STOCK', 'OUT_OF_STOCK', 'QUARANTINE'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }).optional(),
  // Contact & Address
  address: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().optional(),
  pincode: z.string().optional(),
  // Legal & Banking
  gstNumber: z.string().optional(),
  taxIdNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseExpiryDate: z.string().optional(),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  accountType: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  // Financial
  paymentTerms: z.enum(['ADVANCE', 'PAYMENT_ON_DELIVERY', 'LC', 'MILESTONE'], {
    errorMap: () => ({ message: 'Invalid payment terms' }),
  }).optional(),
  creditLimit: z.number().min(0, 'Credit limit must be non-negative').optional(),
  totalOrders: z.number().int().min(0).optional(),
  totalOrderValue: z.number().min(0).optional(),
  lastOrderDate: z.string().optional(),
  notes: z.string().optional(),
  // Vaccine Details
  vaccineType: z.string().optional(),
  vaccineSupplied: z.string().optional(),
  temperature: z.string().optional(),
  maxSupplyCapacity: z.string().optional(),
  certification: z.string().optional(),
  expiredStockHandling: z.string().optional(),
});

export const updateSupplierSchema = z.object({
  // Basic Info
  supplierName: z.string().min(1, 'Supplier name is required').optional(),
  fullName: z.string().min(1, 'Contact person name is required').optional(),
  supplierCode: z.string().min(1, 'Supplier code is required').optional(),
  phone: z.string().min(1, 'Phone number is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  website: z.string().optional(),
  rating: z.string().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'LOW_STOCK', 'OUT_OF_STOCK', 'QUARANTINE'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }).optional(),
  // Contact & Address
  address: z.string().optional(),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().min(1, 'State is required').optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  // Legal & Banking
  gstNumber: z.string().optional(),
  taxIdNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseExpiryDate: z.string().optional(),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  accountType: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  // Financial
  paymentTerms: z.enum(['ADVANCE', 'PAYMENT_ON_DELIVERY', 'LC', 'MILESTONE'], {
    errorMap: () => ({ message: 'Invalid payment terms' }),
  }).optional(),
  creditLimit: z.number().min(0, 'Credit limit must be non-negative').optional(),
  totalOrders: z.number().int().min(0).optional(),
  totalOrderValue: z.number().min(0).optional(),
  lastOrderDate: z.string().optional(),
  notes: z.string().optional(),
  // Vaccine Details
  vaccineType: z.string().optional(),
  vaccineSupplied: z.string().optional(),
  temperature: z.string().optional(),
  maxSupplyCapacity: z.string().optional(),
  certification: z.string().optional(),
  expiredStockHandling: z.string().optional(),
});

// Medical Staff - Update Appointment Status Validation Schema
export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['start_visit', 'check_in', 'check_out'], {
    errorMap: () => ({ message: 'Status must be one of: start_visit, check_in, check_out' }),
  }),
  verificationCode: z.string().length(4, 'Verification code must be 4 digits').optional(), // Required for check_out
  reactions: z.string().optional(),
  notes: z.string().optional(),
});

// Admin User Validation Schemas
export const createAdminUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  // role: z.enum(['SUPER_ADMIN', 'ADMIN'], {
  //   errorMap: () => ({ message: 'Role must be SUPER_ADMIN or ADMIN' }),
  // }),
  role: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }).optional(),
  profilePhoto: z.string().optional(),
  phone: z.string().optional(),
});

export const updateAdminUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN'], {
    errorMap: () => ({ message: 'Role must be SUPER_ADMIN or ADMIN' }),
  }).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }).optional(),
  profilePhoto: z.string().optional(),
  phone: z.string().optional(),
});
export const bookAppointment = z.object({
  childId: z.string().uuid('Invalid child ID'),
  clinicId: z.string().uuid('Invalid vaccination center ID'),
  parentId: z.string().uuid('Invalid parent ID'),
  scheduledDate: z.string().min(1, 'Appointment date is required'),
  scheduledTime: z.string().optional(),
  vaccineId: z.string().uuid('Invalid vaccine ID'),
  medicalStaffId: z.string().uuid(),
  reasonForVisit: z.string().optional(),
  notes: z.string().optional(),
  cancellationReason: z.string().optional(),
  isParentAcknowledged: z.boolean().optional(),
  parentAcknowledgedAt: z.string().optional(),
});


/**
 * Create vaccine transfer schema
 */
export const createVaccineTransferSchema = z.object({
  // Vaccine details
  vaccineId: z.string().min(1, 'Vaccine ID is required'),
  batchNumber: z.string().min(1, 'Batch number is required'),

  // Quantity
  quantityDispatched: z.number().min(1, 'Quantity must be at least 1'),

  // Locations
  fromLocationId: z.string().min(1, 'Source location is required'),
  toLocationId: z.string().min(1, 'Destination location is required'),

  // Dates
  expectedDeliveryDate: z.string().optional(),
  expiryDate: z.string().optional(),
  manufacturingDate: z.string().optional(),

  // Pricing
  price: z.number().min(0).optional(),

  // Storage & Packaging
  packagingType: z.string().optional(),
  storageCondition: z.string().optional(),
  temperatureAtDispatch: z.string().optional(),

  // Dispatch info
  dispatchRemarks: z.string().optional(),
  coldChainMaintained: z.boolean().optional(),

  // Courier details
  courierName: z.string().optional(),
  trackingNumber: z.string().optional(),
  invoiceNo: z.string().optional(),
}).refine(
  (data) => data.fromLocationId !== data.toLocationId,
  {
    message: 'Source and destination locations must be different',
    path: ['toLocationId'],
  }
);

/**
 * Update transfer status schema
 */
export const updateTransferStatusSchema = z.object({
  transferStatus: z.enum(['ORDERED', 'PACKED', 'DISPATCHED', 'IN_TRANSIT', 'ARRIVED'], {
    errorMap: () => ({ message: 'Invalid transfer status' }),
  }),

  // Temperature tracking
  temperatureAtDispatch: z.string().optional(),

  // Courier details
  courierName: z.string().optional(),
  trackingNumber: z.string().optional(),

  // Cold chain
  coldChainMaintained: z.boolean().optional(),

  // Invoice
  invoiceNo: z.string().optional(),
});

/**
 * Receive transfer schema
 */
export const receiveTransferSchema = z.object({
  // Quantities
  quantityReceived: z.number().min(1, 'Quantity received must be at least 1'),
  quantityAccepted: z.number().min(0, 'Quantity accepted cannot be negative'),
  quantityRejected: z.number().min(0, 'Quantity rejected cannot be negative'),

  // Temperature at receipt
  temperatureAtReceive: z.string().optional(),

  // Quality check
  qualityCheck: z.enum(['APPROVED', 'REJECTED', 'PENDING'], {
    errorMap: () => ({ message: 'Invalid quality check status' }),
  }),

  // Remarks
  receiveRemarks: z.string().optional(),
}).refine(
  (data) => data.quantityReceived === data.quantityAccepted + data.quantityRejected,
  {
    message: 'Quantity received must equal accepted + rejected quantities',
    path: ['quantityReceived'],
  }
);

/**
 * Inspect transfer schema
 */
export const inspectTransferSchema = z.object({
  // Quality check result
  inspectedQualityCheck: z.enum(['APPROVED', 'REJECTED', 'PENDING'], {
    errorMap: () => ({ message: 'Invalid inspection status' }),
  }),

  // Inspection remarks
  insepectedRemarks: z.string().optional(),
});

/**
 * Update transfer schema
 */
export const updateVaccineTransferSchema = z.object({
  // Dates
  expectedDeliveryDate: z.string().optional(),

  // Courier details
  courierName: z.string().optional(),
  trackingNumber: z.string().optional(),

  // Remarks
  dispatchRemarks: z.string().optional(),
  receiveRemarks: z.string().optional(),
});

/**
 * Get transfers query schema
 */
export const getTransfersQuerySchema = z.object({
  // Filters
  vaccineId: z.string().optional(),
  fromLocationId: z.string().optional(),
  toLocationId: z.string().optional(),

  // Status filters
  transferStatus: z.enum(['ORDERED', 'PACKED', 'DISPATCHED', 'IN_TRANSIT', 'ARRIVED']).optional(),
  status: z.enum(['DISPATCHED', 'RECEIVED', 'COMPLETED', 'REJECTED']).optional(),

  // Date range
  fromDate: z.string().optional(),
  toDate: z.string().optional(),

  // Search
  search: z.string().optional(),

  // Pagination
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
});

/**
 * Type exports for TypeScript
 */
export type CreateVaccineTransferInput = z.infer<typeof createVaccineTransferSchema>;
export type UpdateTransferStatusInput = z.infer<typeof updateTransferStatusSchema>;
export type ReceiveTransferInput = z.infer<typeof receiveTransferSchema>;
export type InspectTransferInput = z.infer<typeof inspectTransferSchema>;
export type UpdateVaccineTransferInput = z.infer<typeof updateVaccineTransferSchema>;
export type GetTransfersQueryInput = z.infer<typeof getTransfersQuerySchema>;