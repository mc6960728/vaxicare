-- ============================================================================
--                    ⚠️ WARNING - DATA LOSS ⚠️
-- ============================================================================
--
--  THIS SCRIPT WILL DELETE ALL EXISTING DATA FROM YOUR DATABASE!
--
--  What this script does:
--    1. DROPS all existing tables (DELETE)
--    2. Creates fresh empty tables
--    3. ALL YOUR DATA WILL BE PERMANENTLY LOST
--
--  When to use:
--    ✅ Fresh/New database setup (first time)
--    ✅ Development environment reset
--    ❌ NEVER use on production with real data
--
--  Before running:
--    1. Take a backup of your data if needed
--    2. Make sure you really want to delete everything
--    3. This action CANNOT be undone
--
-- ============================================================================
-- VAXICARE DATABASE COMPLETE RECREATION SCRIPT
-- Last Updated: 2025-12-01
-- This script exactly matches prisma/schema.prisma
-- ============================================================================

DO $$ BEGIN CREATE TYPE "AdminRole" AS ENUM ('ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "UserType" AS ENUM ('ADMIN', 'PARENT', 'MEDICAL_STAFF'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "StaffRole" AS ENUM ('DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'ADMINISTRATOR', 'RECEPTIONIST'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED', 'RETIRED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "LocationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "InventoryStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'LOW_STOCK', 'OUT_OF_STOCK', 'QUARANTINE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "StockRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "paymentTerms" AS ENUM ('ADVANCE', 'PAYMENT_ON_DELIVERY', 'LC', 'MILESTONE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

DROP TABLE IF EXISTS "suppliers" CASCADE;
DROP TABLE IF EXISTS "stock_requests" CASCADE;
DROP TABLE IF EXISTS "token_blacklist" CASCADE;
DROP TABLE IF EXISTS "vaccination_records" CASCADE;
DROP TABLE IF EXISTS "appointments" CASCADE;
DROP TABLE IF EXISTS "vaccine_inventory" CASCADE;
DROP TABLE IF EXISTS "vaccine_schedules" CASCADE;
DROP TABLE IF EXISTS "knowledge_base" CASCADE;
DROP TABLE IF EXISTS "children" CASCADE;
DROP TABLE IF EXISTS "medical_staff" CASCADE;
DROP TABLE IF EXISTS "villages" CASCADE;
DROP TABLE IF EXISTS "talukas" CASCADE;
DROP TABLE IF EXISTS "districts" CASCADE;
DROP TABLE IF EXISTS "vaccination_centers" CASCADE;
DROP TABLE IF EXISTS "vaccines" CASCADE;
DROP TABLE IF EXISTS "parents" CASCADE;
DROP TABLE IF EXISTS "admins" CASCADE;
DROP TABLE IF EXISTS "otps" CASCADE;

CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "permissions" JSONB,
    "passwordResetToken" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3),
    "fcmToken" TEXT,
    "deviceType" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "medical_staff" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "passwordResetToken" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT,
    "dialCode" TEXT NOT NULL DEFAULT '+91',
    "phone" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "profilePhoto" TEXT,
    "address" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "fcmToken" TEXT,
    "deviceType" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "role" "StaffRole" NOT NULL,
    "specialization" TEXT,
    "department" TEXT,
    "licenseNumber" TEXT NOT NULL,
    "licenseExpiryDate" TIMESTAMP(3),
    "experienceYears" INTEGER,
    "qualifications" TEXT,
    "clinicId" TEXT,
    "joiningDate" TIMESTAMP(3),
    "salary" DECIMAL(10,2),
    "workingHours" TEXT,
    "currentShift" TEXT,
    "medicalHistory" TEXT,
    "notes" TEXT,
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "medical_staff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "parents" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dialCode" TEXT NOT NULL DEFAULT '+91',
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "relationWithChild" TEXT NOT NULL,
    "profilePhoto" TEXT,
    "password" TEXT NOT NULL,
    "passwordResetToken" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3),
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "fcmToken" TEXT,
    "deviceType" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "children" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "profilePhoto" TEXT,
    "weightKg" DECIMAL(5,2),
    "heightCm" DECIMAL(5,2),
    "bloodGroup" "BloodGroup",
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pediatrician" TEXT,
    "medicalConditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specialNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "children_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "districts" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "state" TEXT NOT NULL DEFAULT 'Gujarat', "districtCode" TEXT NOT NULL, "status" "LocationStatus" NOT NULL DEFAULT 'ACTIVE', "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "districts_pkey" PRIMARY KEY ("id"));
CREATE TABLE "talukas" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "districtId" TEXT NOT NULL, "talukaCode" TEXT NOT NULL, "status" "LocationStatus" NOT NULL DEFAULT 'ACTIVE', "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "talukas_pkey" PRIMARY KEY ("id"));
CREATE TABLE "villages" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "stateId" TEXT NOT NULL, "talukaId" TEXT NOT NULL, "districtId" TEXT NOT NULL, "status" "LocationStatus" NOT NULL DEFAULT 'ACTIVE', "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "villages_pkey" PRIMARY KEY ("id"));
CREATE TABLE "vaccination_centers" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "address" TEXT NOT NULL, "city" TEXT NOT NULL, "state" TEXT NOT NULL, "pincode" TEXT NOT NULL, "country" TEXT NOT NULL DEFAULT 'India', "phone" TEXT NOT NULL, "email" TEXT, "licenseNumber" TEXT NOT NULL, "openingHours" TEXT, "facilities" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "vaccination_centers_pkey" PRIMARY KEY ("id"));
CREATE TABLE "vaccines" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "manufacturer" TEXT NOT NULL, "description" TEXT, "dosage" TEXT,  "ageGroupLabel" TEXT, "dosageCount" INTEGER NOT NULL DEFAULT 1, "intervalBetweenDoses" INTEGER, "price" DECIMAL(10,2), "sideEffects" TEXT, "notes" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "vaccines_pkey" PRIMARY KEY ("id"));
CREATE TABLE "vaccine_inventory" ("id" TEXT NOT NULL, "vaccineId" TEXT NOT NULL, "clinicId" TEXT NOT NULL, "batchNumber" TEXT NOT NULL, "quantity" INTEGER NOT NULL, "costPerUnit" DECIMAL(10,2), "manufacturingDate" TIMESTAMP(3), "expiryDate" TIMESTAMP(3) NOT NULL, "supplier" TEXT, "storageLocation" TEXT, "temperature" TEXT, "status" "InventoryStatus" NOT NULL DEFAULT 'ACTIVE', "notes" TEXT, "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,  "dosesInVial" INTEGER,"remainingDoses" INTEGER, ,"remainingFullVials" INTEGER, "openVialDoses" INTEGER,"totalDoses" INTEGER, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "vaccine_inventory_pkey" PRIMARY KEY ("id"));
CREATE TABLE "appointments" ("id" TEXT NOT NULL, "childId" TEXT, "parentId" TEXT NOT NULL, "clinicId" TEXT NOT NULL, "vaccineId" TEXT NOT NULL, "medicalStaffId" TEXT, "scheduledDate" TIMESTAMP(3) NOT NULL, "scheduledTime" TEXT NOT NULL, "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED', "notes" TEXT, "cancellationReason" TEXT, "checkInTime" TIMESTAMP(3), "checkOutTime" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "appointments_pkey" PRIMARY KEY ("id"));
CREATE TABLE "vaccination_records" ("id" TEXT NOT NULL, "appointmentId" TEXT, "childId" TEXT NOT NULL, "vaccineId" TEXT NOT NULL, "clinicId" TEXT, "administeredBy" TEXT, "administeredDate" TIMESTAMP(3) NOT NULL, "doseNumber" INTEGER NOT NULL, "batchNumber" TEXT, "nextDueDate" TIMESTAMP(3), "reactions" TEXT, "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "vaccination_records_pkey" PRIMARY KEY ("id"));
CREATE TABLE "otps" ("id" TEXT NOT NULL, "dialCode" TEXT NOT NULL DEFAULT '+91', "phone" TEXT NOT NULL, "otp" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "verified" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "otps_pkey" PRIMARY KEY ("id"));
CREATE TABLE "token_blacklist" ("id" TEXT NOT NULL, "token" TEXT NOT NULL, "adminId" TEXT, "parentId" TEXT, "medicalStaffId" TEXT, "userType" "UserType" NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "token_blacklist_pkey" PRIMARY KEY ("id"));
CREATE TABLE "vaccine_schedules" ("id" TEXT NOT NULL, "vaccineId" TEXT NOT NULL, "vaccineName" TEXT NOT NULL, "ageGroupLabel" TEXT NOT NULL, "ageInDays" INTEGER NOT NULL, "ageInMonths" INTEGER, "doseNumber" INTEGER NOT NULL, "displayOrder" INTEGER NOT NULL, "isRequired" BOOLEAN NOT NULL DEFAULT true, "description" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "vaccine_schedules_pkey" PRIMARY KEY ("id"));
CREATE TABLE "knowledge_base" ("id" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT, "content" TEXT NOT NULL, "imageUrl" TEXT, "category" TEXT NOT NULL, "isPublished" BOOLEAN NOT NULL DEFAULT true, "viewCount" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "knowledge_base_pkey" PRIMARY KEY ("id"));
CREATE TABLE "stock_requests" ("id" TEXT NOT NULL, "requestedBy" TEXT NOT NULL, "clinicId" TEXT NOT NULL, "vaccineName" TEXT NOT NULL, "vaccineType" TEXT, "quantity" INTEGER NOT NULL, "preferredDeliveryDate" TIMESTAMP(3), "status" "StockRequestStatus" NOT NULL DEFAULT 'PENDING', "adminNotes" TEXT, "rejectionReason" TEXT, "approvedAt" TIMESTAMP(3), "rejectedAt" TIMESTAMP(3), "fulfilledAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "stock_requests_pkey" PRIMARY KEY ("id"));

-- Suppliers Table (Supplier Management)
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    -- Basic Info
    "supplierName" TEXT NOT NULL,
    "supplierCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "rating" TEXT,
    "status" "InventoryStatus" NOT NULL DEFAULT 'ACTIVE',
    -- Contact & Address
    "address" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "pincode" TEXT,
    -- Legal & Banking
    "gstNumber" TEXT,
    "taxIdNumber" TEXT,
    "licenseNumber" TEXT,
    "licenseExpiryDate" TIMESTAMP(3),
    "bankName" TEXT,
    "bankBranch" TEXT,
    "accountType" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    -- Financial
    "paymentTerms" "paymentTerms" NOT NULL DEFAULT 'ADVANCE',
    "creditLimit" DECIMAL(12,2),
    "totalOrders" INTEGER DEFAULT 0,
    "totalOrderValue" DECIMAL(12,2) DEFAULT 0,
    "lastOrderDate" TIMESTAMP(3),
    "notes" TEXT,
    -- Vaccine Details
    "vaccineType" TEXT,
    "vaccineSupplied" TEXT,
    "temperature" TEXT,
    "maxSupplyCapacity" TEXT,
    "certification" TEXT,
    "expiredStockHandling" TEXT,
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vaccine-transfers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "transferId" TEXT UNIQUE NOT NULL,
  "supplierId" TEXT,
  "transferStatus" "DeliveryType" DEFAULT 'ORDERED',
  "invoiceNo" TEXT,

  -- Vaccine details
  "vaccineId" TEXT NOT NULL,
  "batchNumber" TEXT NOT NULL,
  "temperatureAtDispatch" TEXT,
  "temperatureAtReceive" TEXT,
  "packagingType" TEXT,

  -- Quantity
  "quantityDispatched" INTEGER NOT NULL,
  "quantityReceived" INTEGER,
  "quantityAccepted" INTEGER,
  "quantityRejected" INTEGER,

  -- Locations
  "fromLocationId" TEXT NOT NULL,
  "toLocationId" TEXT NOT NULL,

  -- Dispatch info
  "dispatchedOn" TIMESTAMP NOT NULL DEFAULT NOW(),
  "expectedDeliveryDate" TIMESTAMP,
  "expiryDate" TIMESTAMP,
  "manufacturingDate" TIMESTAMP,
  "price" DECIMAL(10,2),
  "totalAmount" DECIMAL(10,2),
  "coldChainMaintained" BOOLEAN NOT NULL DEFAULT FALSE,
  "courierName" TEXT,
  "trackingNumber" TEXT,
  "storageCondition" TEXT,
  "dispatchRemarks" TEXT,

  -- Receive info
  "receivedOn" TIMESTAMP,
  "receivedBy" TEXT,
  "qualityCheck" "QualityCheckStatus" DEFAULT 'PENDING',
  "receiveRemarks" TEXT,

  "insepectedBy" TEXT,
  "inspectedQualityCheck" "QualityCheckStatus" DEFAULT 'PENDING',
  "insepectedRemarks" TEXT,
  "insepectedOn" TIMESTAMP,

  -- Overall status
  "status" "TransferStatus" DEFAULT 'DISPATCHED',

  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


-- To create the ENUMs for `status` and `qualityCheck`:
CREATE TYPE TransferStatus AS ENUM ('DISPATCHED', 'IN_TRANSIT', 'RECEIVED', 'COMPLETED', 'CANCELLED');
CREATE TYPE QualityCheckStatus AS ENUM ('PENDING', 'PASSED', 'FAILED');
CREATE TYPE "VaccineType" AS ENUM ('ORAL_DROPS','INJECTABLE','ORAL_SOLUTION','NASAL_SPRAY');
CREATE TYPE "VialType" AS ENUM ('SINGLE_DOSE','MULTI_DOSE','PRE_FILLED');
CREATE TYPE "VaccineRouteType" AS ENUM ('ORAL','INTRAMUSCULAR','SUBCUTANEOUS','INTRADERMAL','NASAL');

ALTER TABLE "vaccines"
ADD COLUMN "vaccineType" "VaccineType" DEFAULT 'INJECTABLE',
ADD COLUMN "vialType" "VialType" DEFAULT 'SINGLE_DOSE',
ADD COLUMN "vaccineCode" VARCHAR;
ADD COLUMN "administrationRoute" "VaccineRouteType" DEFAULT 'ORAL';
ADD COLUMN "supplierId" VARCHAR(255),
ADD COLUMN "dosageUnits" VARCHAR,
ADD COLUMN "dosagePerVial" VARCHAR,
ADD COLUMN "dosagePerChild" VARCHAR,
ADD COLUMN "childrenPerVial" VARCHAR,
ADD COLUMN "storageLocation" VARCHAR,
ADD COLUMN "storageCondition" VARCHAR,
ADD COLUMN "lastTemperatureCheck" VARCHAR,
ADD COLUMN "temperature" VARCHAR;



ALTER TABLE "admins" ADD CONSTRAINT "admins_email_key" UNIQUE ("email");
ALTER TABLE "medical_staff" ADD CONSTRAINT "medical_staff_email_key" UNIQUE ("email");
ALTER TABLE "medical_staff" ADD CONSTRAINT "medical_staff_phone_key" UNIQUE ("phone");
ALTER TABLE "medical_staff" ADD CONSTRAINT "medical_staff_licenseNumber_key" UNIQUE ("licenseNumber");
ALTER TABLE "parents" ADD CONSTRAINT "parents_phone_key" UNIQUE ("phone");
ALTER TABLE "parents" ADD CONSTRAINT "parents_email_key" UNIQUE ("email");
ALTER TABLE "districts" ADD CONSTRAINT "districts_districtCode_key" UNIQUE ("districtCode");
ALTER TABLE "talukas" ADD CONSTRAINT "talukas_talukaCode_key" UNIQUE ("talukaCode");
ALTER TABLE "villages" ADD CONSTRAINT "villages_stateId_key" UNIQUE ("stateId");
ALTER TABLE "vaccination_centers" ADD CONSTRAINT "vaccination_centers_licenseNumber_key" UNIQUE ("licenseNumber");
ALTER TABLE "token_blacklist" ADD CONSTRAINT "token_blacklist_token_key" UNIQUE ("token");
ALTER TABLE "vaccination_records" ADD CONSTRAINT "vaccination_records_appointmentId_key" UNIQUE ("appointmentId");
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_supplierCode_key" UNIQUE ("supplierCode");
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_email_key" UNIQUE ("email");

ALTER TABLE "medical_staff" ADD CONSTRAINT "medical_staff_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "vaccination_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "children" ADD CONSTRAINT "children_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "talukas" ADD CONSTRAINT "talukas_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "villages" ADD CONSTRAINT "villages_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "villages" ADD CONSTRAINT "villages_talukaId_fkey" FOREIGN KEY ("talukaId") REFERENCES "talukas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vaccine_inventory" ADD CONSTRAINT "vaccine_inventory_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "vaccination_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vaccine_inventory" ADD CONSTRAINT "vaccine_inventory_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vaccine_inventory" ADD CONSTRAINT "vaccine_inventory_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "vaccines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "vaccination_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_medicalStaffId_fkey" FOREIGN KEY ("medicalStaffId") REFERENCES "medical_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "vaccines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vaccination_records" ADD CONSTRAINT "vaccination_records_administeredBy_fkey" FOREIGN KEY ("administeredBy") REFERENCES "medical_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vaccination_records" ADD CONSTRAINT "vaccination_records_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vaccination_records" ADD CONSTRAINT "vaccination_records_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vaccination_records" ADD CONSTRAINT "vaccination_records_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "vaccines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vaccination_records" ADD CONSTRAINT "vaccination_records_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "vaccination_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vaccine_schedules" ADD CONSTRAINT "vaccine_schedules_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "vaccines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "token_blacklist" ADD CONSTRAINT "token_blacklist_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "token_blacklist" ADD CONSTRAINT "token_blacklist_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "token_blacklist" ADD CONSTRAINT "token_blacklist_medicalStaffId_fkey" FOREIGN KEY ("medicalStaffId") REFERENCES "medical_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_requests" ADD CONSTRAINT "stock_requests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "medical_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_requests" ADD CONSTRAINT "stock_requests_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "vaccination_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD COLUMN "vaccineInventoryId" VARCHAR(255);
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_vaccineInventoryId_fkey" FOREIGN KEY ("vaccineInventoryId") REFERENCES "vaccine_inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccine_supplier_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE;


ALTER TABLE "vaccines"
ALTER COLUMN "vaccineType" SET DEFAULT 'INJECTABLE',
ALTER COLUMN "vialType" SET DEFAULT 'SINGLE_DOSE';
ALTER COLUMN "administrationRoute" SET DEFAULT 'ORAL';
ALTER TABLE "vaccines"
ADD COLUMN "vaccineCode" VARCHAR,
ADD COLUMN "administrationRoute" "VaccineRouteType" DEFAULT 'ORAL';
ALTER TABLE "vaccines" ALTER COLUMN "vaccineCode" DROP NOT NULL;

ALTER TABLE "vaccine-transfers" ADD CONSTRAINT "vaccineTransfers_supplier_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE;
ALTER TABLE "vaccine-transfers" ADD CONSTRAINT "vaccineTransfers_vaccine_fkey" FOREIGN KEY ("vaccineId") REFERENCES "vaccines"("id") ON DELETE CASCADE;
ALTER TABLE "vaccine-transfers" ADD CONSTRAINT "vaccineTransfers_fromLocation_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "vaccination_centers"("id") ON DELETE CASCADE;
ALTER TABLE "vaccine-transfers" ADD CONSTRAINT "vaccineTransfers_toLocation_fkey" FOREIGN KEY ("toLocationId") REFERENCES "vaccination_centers"("id") ON DELETE CASCADE;

CREATE INDEX "admins_email_idx" ON "admins"("email");
CREATE INDEX "admins_role_idx" ON "admins"("role");
CREATE INDEX "admins_status_idx" ON "admins"("status");
CREATE INDEX "admins_isDeleted_idx" ON "admins"("isDeleted");
CREATE INDEX "medical_staff_email_idx" ON "medical_staff"("email");
CREATE INDEX "medical_staff_phone_idx" ON "medical_staff"("phone");
CREATE INDEX "medical_staff_clinicId_idx" ON "medical_staff"("clinicId");
CREATE INDEX "medical_staff_licenseNumber_idx" ON "medical_staff"("licenseNumber");
CREATE INDEX "medical_staff_role_idx" ON "medical_staff"("role");
CREATE INDEX "medical_staff_department_idx" ON "medical_staff"("department");
CREATE INDEX "medical_staff_employmentStatus_idx" ON "medical_staff"("employmentStatus");
CREATE INDEX "medical_staff_status_idx" ON "medical_staff"("status");
CREATE INDEX "medical_staff_isDeleted_idx" ON "medical_staff"("isDeleted");
CREATE INDEX "parents_email_idx" ON "parents"("email");
CREATE INDEX "parents_phone_idx" ON "parents"("phone");
CREATE INDEX "parents_status_idx" ON "parents"("status");
CREATE INDEX "children_parentId_idx" ON "children"("parentId");
CREATE INDEX "children_dateOfBirth_idx" ON "children"("dateOfBirth");
CREATE INDEX "districts_districtCode_idx" ON "districts"("districtCode");
CREATE INDEX "districts_status_idx" ON "districts"("status");
CREATE INDEX "talukas_districtId_idx" ON "talukas"("districtId");
CREATE INDEX "talukas_talukaCode_idx" ON "talukas"("talukaCode");
CREATE INDEX "talukas_status_idx" ON "talukas"("status");
CREATE INDEX "villages_talukaId_idx" ON "villages"("talukaId");
CREATE INDEX "villages_districtId_idx" ON "villages"("districtId");
CREATE INDEX "villages_stateId_idx" ON "villages"("stateId");
CREATE INDEX "villages_status_idx" ON "villages"("status");
CREATE INDEX "vaccination_centers_city_idx" ON "vaccination_centers"("city");
CREATE INDEX "vaccination_centers_state_idx" ON "vaccination_centers"("state");
CREATE INDEX "vaccination_centers_isActive_idx" ON "vaccination_centers"("isActive");
CREATE INDEX "vaccines_name_idx" ON "vaccines"("name");
CREATE INDEX "vaccines_isActive_idx" ON "vaccines"("isActive");
CREATE INDEX "vaccines_ageGroupLabel_idx" ON "vaccines"("ageGroupLabel");
CREATE INDEX "vaccine_inventory_vaccineId_idx" ON "vaccine_inventory"("vaccineId");
CREATE INDEX "vaccine_inventory_clinicId_idx" ON "vaccine_inventory"("clinicId");
CREATE INDEX "vaccine_inventory_expiryDate_idx" ON "vaccine_inventory"("expiryDate");
CREATE INDEX "vaccine_inventory_batchNumber_idx" ON "vaccine_inventory"("batchNumber");
CREATE INDEX "vaccine_inventory_status_idx" ON "vaccine_inventory"("status");
CREATE INDEX "appointments_childId_idx" ON "appointments"("childId");
CREATE INDEX "appointments_parentId_idx" ON "appointments"("parentId");
CREATE INDEX "appointments_clinicId_idx" ON "appointments"("clinicId");
CREATE INDEX "appointments_medicalStaffId_idx" ON "appointments"("medicalStaffId");
CREATE INDEX "appointments_scheduledDate_idx" ON "appointments"("scheduledDate");
CREATE INDEX "appointments_status_idx" ON "appointments"("status");
CREATE INDEX "vaccination_records_childId_idx" ON "vaccination_records"("childId");
CREATE INDEX "vaccination_records_vaccineId_idx" ON "vaccination_records"("vaccineId");
CREATE INDEX "vaccination_records_clinicId_idx" ON "vaccination_records"("clinicId");
CREATE INDEX "vaccination_records_administeredBy_idx" ON "vaccination_records"("administeredBy");
CREATE INDEX "vaccination_records_administeredDate_idx" ON "vaccination_records"("administeredDate");
CREATE INDEX "otps_phone_idx" ON "otps"("phone");
CREATE INDEX "otps_expiresAt_idx" ON "otps"("expiresAt");
CREATE INDEX "token_blacklist_token_idx" ON "token_blacklist"("token");
CREATE INDEX "token_blacklist_adminId_idx" ON "token_blacklist"("adminId");
CREATE INDEX "token_blacklist_parentId_idx" ON "token_blacklist"("parentId");
CREATE INDEX "token_blacklist_medicalStaffId_idx" ON "token_blacklist"("medicalStaffId");
CREATE INDEX "token_blacklist_userType_idx" ON "token_blacklist"("userType");
CREATE INDEX "token_blacklist_expiresAt_idx" ON "token_blacklist"("expiresAt");
CREATE INDEX "vaccine_schedules_vaccineId_idx" ON "vaccine_schedules"("vaccineId");
CREATE INDEX "vaccine_schedules_ageInDays_idx" ON "vaccine_schedules"("ageInDays");
CREATE INDEX "vaccine_schedules_displayOrder_idx" ON "vaccine_schedules"("displayOrder");
CREATE INDEX "knowledge_base_category_idx" ON "knowledge_base"("category");
CREATE INDEX "knowledge_base_isPublished_idx" ON "knowledge_base"("isPublished");
CREATE INDEX "stock_requests_requestedBy_idx" ON "stock_requests"("requestedBy");
CREATE INDEX "stock_requests_clinicId_idx" ON "stock_requests"("clinicId");
CREATE INDEX "stock_requests_status_idx" ON "stock_requests"("status");
CREATE INDEX "stock_requests_createdAt_idx" ON "stock_requests"("createdAt");
CREATE INDEX "suppliers_supplierCode_idx" ON "suppliers"("supplierCode");
CREATE INDEX "suppliers_email_idx" ON "suppliers"("email");
CREATE INDEX "suppliers_status_idx" ON "suppliers"("status");
CREATE INDEX "suppliers_city_idx" ON "suppliers"("city");
CREATE INDEX "suppliers_state_idx" ON "suppliers"("state");

CREATE INDEX "appointments_vaccineInventoryId_idx" ON "appointments"("vaccineInventoryId");
CREATE INDEX "vaccine-transfers_vaccineId_batchNumber_idx" ON "vaccine-transfers" ("vaccineId", "batchNumber");

CREATE INDEX "vaccine-transfers_fromLocationId_toLocationId_idx" ON "vaccine-transfers" ("fromLocationId", "toLocationId");


CREATE TYPE "DeliveryType" AS ENUM (
  'ORDERED',
  'PACKED',
  'DISPATCHED',
  'IN_TRANSIT',
  'ARRIVED'
);

CREATE TYPE "TransferStatus" AS ENUM (
  'DISPATCHED',
  'IN_TRANSIT',
  'RECEIVED',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "QualityCheckStatus" AS ENUM (
  'PENDING',
  'PASSED',
  'FAILED'
);
