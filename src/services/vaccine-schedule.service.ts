import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

interface CreateVaccineScheduleInput {
  vaccineId: string;
  vaccineName: string;
  ageGroupLabel: string;
  ageInDays: number;
  ageInMonths?: number;
  doseNumber: number;
  displayOrder: number;
  isRequired?: boolean;
  description?: string;
}

interface UpdateVaccineScheduleInput {
  vaccineName?: string;
  ageGroupLabel?: string;
  ageInDays?: number;
  ageInMonths?: number;
  doseNumber?: number;
  displayOrder?: number;
  isRequired?: boolean;
  description?: string;
}

export class VaccineScheduleService {
  /**
   * Get all vaccine schedules grouped by age
   */
  async getAllSchedules() {
    const schedules = await prisma.vaccineSchedule.findMany({
      include: {
        vaccine: true,
      },
      orderBy: [
        { ageInDays: 'asc' },
        { displayOrder: 'asc' },
      ],
    });

    // Group by age group
    const groupedSchedules: Record<string, any[]> = {};

    schedules.forEach((schedule) => {
      if (!groupedSchedules[schedule.ageGroupLabel]) {
        groupedSchedules[schedule.ageGroupLabel] = [];
      }
      groupedSchedules[schedule.ageGroupLabel].push({
        id: schedule.id,
        vaccineId: schedule.vaccineId,
        vaccineName: schedule.vaccineName,
        ageGroupLabel: schedule.ageGroupLabel,
        ageInDays: schedule.ageInDays,
        ageInMonths: schedule.ageInMonths,
        doseNumber: schedule.doseNumber,
        displayOrder: schedule.displayOrder,
        isRequired: schedule.isRequired,
        description: schedule.description,
        vaccine: {
          id: schedule.vaccine.id,
          name: schedule.vaccine.name,
          // manufacturer: schedule.vaccine.manufacturer,
          isActive: schedule.vaccine.isActive,
        },
      });
    });

    return {
      schedules: groupedSchedules,
      totalSchedules: schedules.length,
    };
  }

  /**
   * Get schedules for a specific vaccine
   */
  async getSchedulesByVaccine(vaccineId: string) {
    // Verify vaccine exists
    const vaccine = await prisma.vaccine.findUnique({
      where: { id: vaccineId },
    });

    if (!vaccine) {
      throw new AppError('Vaccine not found', 404);
    }

    const schedules = await prisma.vaccineSchedule.findMany({
      where: { vaccineId },
      orderBy: [
        { ageInDays: 'asc' },
        { doseNumber: 'asc' },
      ],
    });

    return {
      vaccine: {
        id: vaccine.id,
        name: vaccine.name,
        // manufacturer: vaccine.manufacturer,
      },
      schedules,
    };
  }

  /**
   * Get schedule by ID
   */
  async getScheduleById(id: string) {
    const schedule = await prisma.vaccineSchedule.findUnique({
      where: { id },
      include: {
        vaccine: true,
      },
    });

    if (!schedule) {
      throw new AppError('Vaccine schedule not found', 404);
    }

    return schedule;
  }

  /**
   * Create vaccine schedule (Admin only)
   */
  async createSchedule(data: CreateVaccineScheduleInput) {
    // Verify vaccine exists
    const vaccine = await prisma.vaccine.findUnique({
      where: { id: data.vaccineId },
    });

    if (!vaccine) {
      throw new AppError('Vaccine not found', 404);
    }

    // Check for duplicate schedule
    const existingSchedule = await prisma.vaccineSchedule.findFirst({
      where: {
        vaccineId: data.vaccineId,
        ageInDays: data.ageInDays,
        doseNumber: data.doseNumber,
      },
    });

    if (existingSchedule) {
      throw new AppError(
        'A schedule already exists for this vaccine at this age and dose number',
        409
      );
    }

    const schedule = await prisma.vaccineSchedule.create({
      data: {
        vaccineId: data.vaccineId,
        vaccineName: data.vaccineName,
        ageGroupLabel: data.ageGroupLabel,
        ageInDays: data.ageInDays,
        ageInMonths: data.ageInMonths,
        doseNumber: data.doseNumber,
        displayOrder: data.displayOrder,
        isRequired: data.isRequired ?? true,
        description: data.description,
      },
      include: {
        vaccine: true,
      },
    });

    return schedule;
  }

  /**
   * Update vaccine schedule (Admin only)
   */
  async updateSchedule(id: string, data: UpdateVaccineScheduleInput) {
    // Verify schedule exists
    const existingSchedule = await prisma.vaccineSchedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      throw new AppError('Vaccine schedule not found', 404);
    }

    const schedule = await prisma.vaccineSchedule.update({
      where: { id },
      data,
      include: {
        vaccine: true,
      },
    });

    return schedule;
  }

  /**
   * Delete vaccine schedule (Admin only)
   */
  async deleteSchedule(id: string) {
    // Verify schedule exists
    const schedule = await prisma.vaccineSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new AppError('Vaccine schedule not found', 404);
    }

    // Check if there are any vaccination records using this schedule
    // const recordsCount = await prisma.vaccinationRecord.count({
    //   where: { vaccineScheduleId: id },
    // });

    // if (recordsCount > 0) {
    //   throw new AppError(
    //     `Cannot delete schedule. ${recordsCount} vaccination record(s) are linked to this schedule`,
    //     400
    //   );
    // }

    await prisma.vaccineSchedule.delete({
      where: { id },
    });

    return { message: 'Vaccine schedule deleted successfully' };
  }
}
