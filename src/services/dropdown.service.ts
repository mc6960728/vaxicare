import { prisma } from '../config/database';

export class DropdownService {
  /**
   * Get all STATIC dropdown data (enums only - no database queries)
   * Single API for both app and admin panel
   */
  getAllDropdowns() {
    return {
      // User & Profile related
      bloodGroups: this.getBloodGroups(),
      allergies: this.getAllergies(),
      genders: this.getGenders(),
      relations: this.getRelations(),
      medicalConditions: this.getMedicalConditions(),

      // Staff related
      roles: this.getStaffRoles(),
      staffRoles: this.getStaffRoles(), // Kept for backward compatibility
      departments: this.getDepartments(),
      employmentStatuses: this.getEmploymentStatuses(),
      userStatuses: this.getUserStatuses(),

      // Appointment related
      appointmentStatuses: this.getAppointmentStatuses(),

      // Vaccine related dropdowns (static enums)
      vaccineTypes: this.getVaccineTypes(),
      administrationRoutes: this.getAdministrationRoutes(),
      vialTypes: this.getVialTypes(),
      vaccineCategories: this.getVaccineCategories(),
      openedVialStatuses: this.getOpenedVialStatuses(),
      dosageUnits: this.getDosageUnits(),
      storageTemperatures: this.getStorageTemperatures(),
      vaccineAgeGroups: this.getVaccineAgeGroups(),

      // Inventory related dropdowns
      stockStatuses: this.getStockStatuses(),

      // Transfer/Dispatch related dropdowns
      transferStatuses: this.getTransferStatuses(),
      deliveryStatuses: this.getDeliveryStatuses(),
      qualityCheckStatuses: this.getQualityCheckStatuses(),
    };
  }

  /**
   * Get blood group dropdown
   */
  getBloodGroups() {
    return [
      { value: 'A_POSITIVE', label: 'A+' },
      { value: 'A_NEGATIVE', label: 'A-' },
      { value: 'B_POSITIVE', label: 'B+' },
      { value: 'B_NEGATIVE', label: 'B-' },
      { value: 'AB_POSITIVE', label: 'AB+' },
      { value: 'AB_NEGATIVE', label: 'AB-' },
      { value: 'O_POSITIVE', label: 'O+' },
      { value: 'O_NEGATIVE', label: 'O-' },
    ];
  }

  /**
   * Get common allergies dropdown
   */
  getAllergies() {
    return [
      { value: 'peanuts', label: 'Peanuts' },
      { value: 'tree_nuts', label: 'Tree Nuts' },
      { value: 'milk', label: 'Milk/Dairy' },
      { value: 'eggs', label: 'Eggs' },
      { value: 'wheat', label: 'Wheat' },
      { value: 'soy', label: 'Soy' },
      { value: 'fish', label: 'Fish' },
      { value: 'shellfish', label: 'Shellfish' },
      { value: 'penicillin', label: 'Penicillin' },
      { value: 'aspirin', label: 'Aspirin' },
      { value: 'ibuprofen', label: 'Ibuprofen' },
      { value: 'sulfa_drugs', label: 'Sulfa Drugs' },
      { value: 'latex', label: 'Latex' },
      { value: 'pollen', label: 'Pollen' },
      { value: 'dust_mites', label: 'Dust Mites' },
      { value: 'pet_dander', label: 'Pet Dander' },
      { value: 'mold', label: 'Mold' },
      { value: 'insect_stings', label: 'Insect Stings' },
      { value: 'none', label: 'No Known Allergies' },
      { value: 'other', label: 'Other' },
    ];
  }

  /**
   * Get gender dropdown
   */
  getGenders() {
    return [
      { value: 'MALE', label: 'Male' },
      { value: 'FEMALE', label: 'Female' },
      { value: 'OTHER', label: 'Other' },
    ];
  }

  /**
   * Get parent relation dropdown
   */
  getRelations() {
    return [
      { value: 'Father', label: 'Father' },
      { value: 'Mother', label: 'Mother' },
      { value: 'Guardian', label: 'Guardian' },
    ];
  }

  /**
   * Get staff roles dropdown
   */
  getStaffRoles() {
    return [
      { value: 'DOCTOR', label: 'Doctor' },
      { value: 'NURSE', label: 'Nurse' },
      { value: 'PHARMACIST', label: 'Pharmacist' },
      { value: 'LAB_TECHNICIAN', label: 'Lab Technician' },
      { value: 'ADMINISTRATOR', label: 'Administrator' },
      { value: 'RECEPTIONIST', label: 'Receptionist' },
    ];
  }

  /**
   * Get departments dropdown
   */
  getDepartments() {
    return [
      { value: 'PEDIATRICS', label: 'Pediatrics' },
      { value: 'GENERAL_MEDICINE', label: 'General Medicine' },
      { value: 'IMMUNIZATION', label: 'Immunization' },
      { value: 'EMERGENCY', label: 'Emergency' },
      { value: 'OUTPATIENT', label: 'Outpatient (OPD)' },
      { value: 'NURSING', label: 'Nursing' },
      { value: 'PHARMACY', label: 'Pharmacy' },
      { value: 'LABORATORY', label: 'Laboratory' },
      { value: 'ADMINISTRATION', label: 'Administration' },
      { value: 'RECEPTION', label: 'Reception' },
    ];
  }

  /**
   * Get employment status dropdown
   */
  getEmploymentStatuses() {
    return [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'ON_LEAVE', label: 'On Leave' },
      { value: 'RESIGNED', label: 'Resigned' },
      { value: 'TERMINATED', label: 'Terminated' },
      { value: 'RETIRED', label: 'Retired' },
    ];
  }

  /**
   * Get user status dropdown
   */
  getUserStatuses() {
    return [
      { value: 'ALL', label: 'All' },
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
      { value: 'SUSPENDED', label: 'Suspended' },
      { value: 'DELETED', label: 'Deleted' },
    ];
  }

  /**
   * Get appointment status dropdown
   */
  getAppointmentStatuses() {
    return [
      { value: 'SCHEDULED', label: 'Scheduled' },
      { value: 'CONFIRMED', label: 'Confirmed' },
      { value: 'COMPLETED', label: 'Completed' },
      { value: 'CANCELLED', label: 'Cancelled' },
      { value: 'NO_SHOW', label: 'No Show' },
      { value: 'RESCHEDULED', label: 'Rescheduled' },
      { value: 'CHECK_OUT', label: 'Check Out' },
      { value: 'CHECK_IN', label: 'Check In' },
      { value: 'START_VISIT', label: 'Start Visit' },

    ];
  }

  /**
   * Get vaccine types dropdown
   * Types: Oral Drops (OPV, Rotavirus), Injectable (BCG, DPT), etc.
   */
  getVaccineTypes() {
    return [
      { value: 'ORAL_DROPS', label: 'Oral Drops', description: 'Given as drops in mouth (e.g., OPV, Rotavirus)' },
      { value: 'INJECTABLE', label: 'Injectable', description: 'Given via injection (e.g., BCG, DPT, Hepatitis B)' },
      { value: 'ORAL_SOLUTION', label: 'Oral Solution', description: 'Liquid to be swallowed' },
      { value: 'NASAL_SPRAY', label: 'Nasal Spray', description: 'Sprayed into nose (e.g., FluMist)' },
    ];
  }

  /**
   * Get administration routes dropdown
   * How the vaccine is administered
   */
  getAdministrationRoutes() {
    return [
      { value: 'ORAL', label: 'Oral', description: 'By mouth' },
      { value: 'INTRAMUSCULAR', label: 'Intramuscular (IM)', description: 'Into the muscle' },
      { value: 'SUBCUTANEOUS', label: 'Subcutaneous (SC)', description: 'Under the skin' },
      { value: 'INTRADERMAL', label: 'Intradermal (ID)', description: 'Into the skin (e.g., BCG)' },
      { value: 'NASAL', label: 'Nasal', description: 'Through the nose' },
    ];
  }

  /**
   * Get vial types dropdown
   * Single dose vs Multi-dose vials
   */
  getVialTypes() {
    return [
      { value: 'SINGLE_DOSE', label: 'Single Dose', description: 'One dose per vial' },
      { value: 'MULTI_DOSE', label: 'Multi Dose', description: 'Multiple doses per vial (e.g., OPV has 10-20 doses)' },
      { value: 'PRE_FILLED', label: 'Pre-filled Syringe', description: 'Ready to administer syringe' },
    ];
  }

  /**
   * Get vaccine categories dropdown
   * UIP (Universal Immunization Program), Optional, etc.
   */
  getVaccineCategories() {
    return [
      { value: 'UIP', label: 'UIP (Universal Immunization Program)', description: 'Government provided free vaccines' },
      { value: 'OPTIONAL', label: 'Optional', description: 'Recommended but not mandatory' },
      { value: 'TRAVEL', label: 'Travel', description: 'Required for international travel' },
      { value: 'SEASONAL', label: 'Seasonal', description: 'Given during specific seasons (e.g., Flu)' },
    ];
  }

  /**
   * Get opened vial statuses dropdown
   * For tracking multi-dose vials after opening
   */
  getOpenedVialStatuses() {
    return [
      { value: 'IN_USE', label: 'In Use', description: 'Currently being used for vaccination' },
      { value: 'EXHAUSTED', label: 'Exhausted', description: 'All doses used' },
      { value: 'EXPIRED', label: 'Expired', description: 'Exceeded open vial policy time' },
      { value: 'DISCARDED', label: 'Discarded', description: 'Discarded due to policy/contamination' },
      { value: 'CONTAMINATED', label: 'Contaminated', description: 'Contaminated and unusable' },
    ];
  }

  /**
   * Get dosage units dropdown
   */
  getDosageUnits() {
    return [
      { value: 'ml', label: 'Milliliter (ml)' },
      { value: 'drops', label: 'Drops' },
      { value: 'mcg', label: 'Microgram (mcg)' },
      { value: 'mg', label: 'Milligram (mg)' },
      { value: 'IU', label: 'International Unit (IU)' },
    ];
  }

  /**
   * Get storage temperature ranges dropdown
   */
  getStorageTemperatures() {
    return [
      { value: 'FROZEN', label: 'Frozen (-25°C to -15°C)', minTemp: -25, maxTemp: -15 },
      { value: 'REFRIGERATED', label: 'Refrigerated (2°C to 8°C)', minTemp: 2, maxTemp: 8 },
      { value: 'UNDER_REFRIGERATED', label: 'Under Refrigerated (8°C to 15°C)', minTemp: 8, maxTemp: 15 },
      { value: 'ROOM_TEMP', label: 'Room Temperature (15°C to 25°C)', minTemp: 15, maxTemp: 25 },
      { value: 'OPEN_AREA', label: 'Open Area (25°C+)', minTemp: 25, maxTemp: null },
    ];
  }

  /**
   * Get age group labels dropdown for vaccines
   */
  getVaccineAgeGroups() {
    return [
      { value: 'Birth', label: 'At Birth', minWeeks: 0, maxWeeks: 0 },
      { value: '6 Weeks', label: '6 Weeks', minWeeks: 6, maxWeeks: 6 },
      { value: '10 Weeks', label: '10 Weeks', minWeeks: 10, maxWeeks: 10 },
      { value: '14 Weeks', label: '14 Weeks', minWeeks: 14, maxWeeks: 14 },
      { value: '6 Months', label: '6 Months', minWeeks: 24, maxWeeks: 26 },
      { value: '9 Months', label: '9 Months', minWeeks: 36, maxWeeks: 39 },
      { value: '12 Months', label: '12 Months', minWeeks: 48, maxWeeks: 52 },
      { value: '15 Months', label: '15 Months', minWeeks: 60, maxWeeks: 65 },
      { value: '16-24 Months', label: '16-24 Months', minWeeks: 64, maxWeeks: 104 },
      { value: '5 Years', label: '5 Years', minWeeks: 260, maxWeeks: 260 },
      { value: '10 Years', label: '10 Years', minWeeks: 520, maxWeeks: 520 },
    ];
  }

  /**
   * Get medical conditions dropdown
   */
  getMedicalConditions() {
    return [
      { value: 'asthma', label: 'Asthma' },
      { value: 'diabetes', label: 'Diabetes' },
      { value: 'heart_disease', label: 'Heart Disease' },
      { value: 'hypertension', label: 'Hypertension' },
      { value: 'epilepsy', label: 'Epilepsy' },
      { value: 'autism', label: 'Autism' },
      { value: 'adhd', label: 'ADHD' },
      { value: 'cerebral_palsy', label: 'Cerebral Palsy' },
      { value: 'down_syndrome', label: 'Down Syndrome' },
      { value: 'immune_deficiency', label: 'Immune Deficiency' },
      { value: 'none', label: 'No Known Conditions' },
      { value: 'other', label: 'Other' },
    ];
  }

  /**
   * Get stock statuses dropdown
   * For filtering/displaying vaccine inventory stock levels
   */
  getStockStatuses() {
    return [
      { value: 'ALL', label: 'All Stock', description: 'Show all inventory items' },
      { value: 'ACTIVE', label: 'In Stock', description: 'Available and ready for use' },
      { value: 'LOW_STOCK', label: 'Low Stock', description: 'Stock running low, needs reorder' },
      { value: 'OUT_OF_STOCK', label: 'Out of Stock', description: 'No stock available' },
      { value: 'EXPIRED', label: 'Expired', description: 'Stock has expired' },
      { value: 'QUARANTINE', label: 'Quarantine', description: 'Stock under inspection/hold' },
    ];
  }

  /**
   * Get transfer statuses dropdown
   * For vaccine dispatch/transfer tracking
   */
  getTransferStatuses() {
    return [
      { value: 'ALL', label: 'All Statuses', description: 'Show all transfers' },
      { value: 'DISPATCHED', label: 'Dispatched', description: 'Vaccine has been dispatched from source' },
      { value: 'IN_TRANSIT', label: 'In Transit', description: 'Vaccine is in transit' },
      { value: 'RECEIVED', label: 'Received', description: 'Vaccine received at destination' },
      { value: 'COMPLETED', label: 'Completed', description: 'Transfer completed successfully' },
      { value: 'CANCELLED', label: 'Cancelled', description: 'Transfer has been cancelled' },
    ];
  }

  /**
   * Get delivery statuses dropdown
   * For tracking delivery stages of vaccine transfers
   */
  getDeliveryStatuses() {
    return [
      { value: 'ALL', label: 'All Statuses', description: 'Show all delivery stages' },
      { value: 'ORDERED', label: 'Ordered', description: 'Order has been placed' },
      { value: 'PACKED', label: 'Packed', description: 'Order is packed and ready' },
      { value: 'DISPATCHED', label: 'Dispatched', description: 'Order has been dispatched' },
      { value: 'IN_TRANSIT', label: 'In Transit', description: 'Order is on the way' },
      { value: 'ARRIVED', label: 'Arrived', description: 'Order has arrived at destination' },
    ];
  }

  /**
   * Get quality check statuses dropdown
   * For vaccine quality inspection status
   */
  getQualityCheckStatuses() {
    return [
      { value: 'ALL', label: 'All Statuses', description: 'Show all quality check statuses' },
      { value: 'PENDING', label: 'Pending', description: 'Quality check pending' },
      { value: 'PASSED', label: 'Passed', description: 'Quality check passed' },
      { value: 'FAILED', label: 'Failed', description: 'Quality check failed' },
    ];
  }

  /**
   * Get districts dropdown (from database)
   */
  async getDistricts() {
    const districts = await prisma.district.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        // districtCode: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return districts.map(district => ({
      value: district.id,
      label: district.name,
      // code: district.districtCode,
    }));
  }

  /**
   * Get talukas by district dropdown (from database)
   */
  async getTalukasByDistrict(districtId: string) {
    const talukas = await prisma.taluka.findMany({
      where: {
        districtId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        // talukaCode: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return talukas.map(taluka => ({
      value: taluka.id,
      label: taluka.name,
      // code: taluka.talukaCode,
    }));
  }

  /**
   * Get villages by taluka dropdown (from database)
   */
  async getVillagesByTaluka(talukaId: string) {
    const villages = await prisma.village.findMany({
      where: {
        talukaId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return villages.map(village => ({
      value: village.id,
      label: village.name,
    }));
  }

  /**
   * Get all villages with taluka and district info (for auto-fill)
   * Returns village with parent taluka and district details
   */
  async getAllVillagesWithLocation() {
    const villages = await prisma.village.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        taluka: {
          select: {
            id: true,
            name: true,
            // talukaCode: true,
            district: {
              select: {
                id: true,
                name: true,
                // districtCode: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return villages.map(village => ({
      villageId: village.id,
      villageName: village.name,
      talukaId: village.taluka.id,
      talukaName: village.taluka.name,
      // talukaCode: village.taluka.talukaCode,
      districtId: village.taluka.district.id,
      districtName: village.taluka.district.name,
      // districtCode: village.taluka.district.districtCode,
    }));
  }

  /**
   * Get vaccination centers dropdown (from database)
   * @param isAdmin - If true (admin panel), returns only id & name; if false (app), returns full details
   */
  async getVaccinationCenters(isAdmin: boolean = false) {
    if (isAdmin) {
      // Admin Panel: Return only id and name
      const centers = await prisma.vaccinationCenter.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return centers
    }

    // App: Return full details (default)
    return prisma.vaccinationCenter.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        address: true,
        pincode: true,
        phone: true,
        district: { select: { id: true, name: true } },
        taluka: { select: { id: true, name: true } },
        village: { select: { id: true, name: true } },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get vaccines dropdown (from database)
   */
  async getVaccines(filters?: { ageGroupLabel?: string; isActive?: boolean }) {
    const vaccines = await prisma.vaccine.findMany({
      where: {
        isActive: filters?.isActive !== undefined ? filters.isActive : true,
        ...(filters?.ageGroupLabel && { ageGroupLabel: filters.ageGroupLabel }),
      },
      select: {
        id: true,
        name: true,
        // manufacturer: true,
        // ageGroupLabel: true,
        // dosageCount: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return vaccines
    // return vaccines.map(vaccine => ({
    //   value: vaccine.id,
    //   label: vaccine.name,
    // }));
  }

  /**
   * Get medical staff dropdown (Doctors/Paediatricians list)
   * @param filters - Optional filters for clinicId and role
   */
  async getMedicalStaff(filters?: { clinicId?: string; role?: string }) {
    const medicalStaff = await prisma.medicalStaff.findMany({
      where: {
        status: 'ACTIVE',
        employmentStatus: 'ACTIVE',
        isDeleted: false,
        ...(filters?.clinicId && { clinicId: filters.clinicId }),
        ...(filters?.role && { role: filters.role as any }),
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    // return medicalStaff.map(staff => ({
    //   value: staff.id,
    //   label: staff.fullName || `${staff.firstName} ${staff.lastName}`,
    // }));
    return medicalStaff
  }

  /**
   * Get doctors/paediatricians by vaccination center
   * @param clinicId - Vaccination center ID
   */
  async getDoctorsByCenter(clinicId: string) {
    return this.getMedicalStaff({ clinicId, role: 'DOCTOR' });
  }

  /**
   * Get suppliers dropdown (from database)
   * Returns only id and name for dropdown selection
   */
  async getSuppliers() {
    const suppliers = await prisma.supplier.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        supplierName: true,
      },
      orderBy: {
        supplierName: 'asc',
      },
    });

    return suppliers
  }
}
