import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

export class VaccinationPlanService {
  /**
   * Get child's vaccination plan with schedule and records
   * @param childId - Child ID
   * @param parentId - Parent ID
   * @param view - View type: 'full' | 'pending' | 'completed' | 'upcoming'
   */
  async getChildVaccinationPlan(childId: string, parentId: string) {
    // Verify child belongs to parent
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        parentId: parentId,
        isActive: true,
      },
      include: {
        parent: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!child) {
      throw new AppError('Child not found or does not belong to you', 404);
    }

    // Calculate child's age in days and months
    const today = new Date();
    const birthDate = new Date(child.dateOfBirth);
    const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    const ageInMonths = Math.floor(ageInDays / 30);
    const ageInYears = Math.floor(ageInMonths / 12);
    const remainingMonths = ageInMonths % 12;

    // Get all vaccine schedules
    const vaccineSchedules = await prisma.vaccineSchedule.findMany({
      where: {
        vaccine: {
          isActive: true,
        },
      },
      include: {
        vaccine: true,
      },
      orderBy: [
        { ageInDays: 'asc' },
        { displayOrder: 'asc' },
      ],
    });

    // Get completed vaccination records for this child
    const vaccinationRecords = await prisma.vaccinationRecord.findMany({
      where: {
        childId: childId,
      },
      include: {
        vaccine: true,
        medicalStaff: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
          },
        },
        appointment: {
          include: {
            vaccinationCenter: {
              select: {
                id: true,
                name: true,
                address: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        administeredDate: 'desc',
      },
    });

    // Get scheduled appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        childId: childId,
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
      include: {
        vaccine: true,
        vaccinationCenter: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        medicalStaff: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    // Group schedules by age group
    const schedulesByAgeGroup = this.groupSchedulesByAge(vaccineSchedules, vaccinationRecords, appointments);

    // Return only schedulesByAgeGroup for vaccination plan page
    return {
      schedulesByAgeGroup,
    };
  }

  /**
   * Group vaccine schedules by age group
   */
  private groupSchedulesByAge(
    schedules: any[],
    completedRecords: any[],
    appointments: any[]
  ) {

    const grouped = new Map<string, any>();

    schedules.forEach(schedule => {
      const ageLabel = schedule.ageGroupLabel;

      if (!grouped.has(ageLabel)) {
        grouped.set(ageLabel, {
          ageGroupLabel: ageLabel,
          ageInDays: schedule.ageInDays,
          ageInMonths: schedule.ageInMonths,
          vaccines: [],
        });
      }

      // Check if this vaccine dose is completed
      const completed = completedRecords.find(
        record =>
          record.vaccineId === schedule.vaccineId &&
          record.doseNumber === schedule.doseNumber
      );

      // Check if there's a scheduled appointment
      const appointment = appointments.find(
        apt =>
          apt.vaccineId === schedule.vaccineId &&
          !completedRecords.some(
            rec => rec.vaccineId === schedule.vaccineId && rec.doseNumber === schedule.doseNumber
          )
      );

      // Check if parent can toggle this vaccine
      // Parents can only toggle vaccines for 0-30 days that were NOT completed by medical staff
      const canParentToggle =
        schedule.ageInDays <= 30 &&
        (!completed || !completed.appointmentId); // Not completed through appointment

      grouped.get(ageLabel)!.vaccines.push({
        scheduleId: schedule.id,
        vaccine: {
          id: schedule.vaccine.id,
          name: schedule.vaccine.name,
          manufacturer: schedule.vaccine.manufacturer,
          description: schedule.vaccine.description,
          dosageCount: schedule.vaccine.dosageCount,
        },
        doseNumber: schedule.doseNumber,
        isRequired: schedule.isRequired,
        description: schedule.description,
        status: completed ? 'COMPLETED' : appointment ? 'SCHEDULED' : 'PENDING',
        canParentToggle: canParentToggle, // NEW: Flag to show if parent can mark complete
        completedByMedicalStaff: completed?.appointmentId ? true : false, // NEW: Was it completed by medical staff?
        completedRecord: completed
          ? {
            id: completed.id,
            administeredDate: completed.administeredDate,
            batchNumber: completed.vaccine?.batchNumber || null,
            vaccinationCenter: completed.appointment?.vaccinationCenter || null,
            medicalStaff: completed.medicalStaff,
          }
          : null,
        scheduledAppointment: appointment
          ? {
            id: appointment.id,
            scheduledDate: appointment.scheduledDate,
            scheduledTime: appointment.scheduledTime,
            vaccinationCenter: appointment.vaccinationCenter,
          }
          : null,
      });
    });

    return Array.from(grouped.values()).sort((a, b) => a.ageInDays - b.ageInDays);
  }

  /**
   * Format age for display
   */
  private formatAge(years: number, months: number): string {
    if (years === 0) {
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    } else if (months === 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    } else {
      return `${years} ${years === 1 ? 'year' : 'years'} ${months} ${months === 1 ? 'month' : 'months'}`;
    }
  }

  /**
   * Get dose label from dose number
   */
  private getDoseLabel(doseNumber: number): string {
    const labels: { [key: number]: string } = {
      1: 'First',
      2: 'Second',
      3: 'Third',
      4: 'Fourth',
      5: 'Fifth',
    };
    return labels[doseNumber] || `Dose ${doseNumber}`;
  }

  /**
   * Get knowledge base articles
   */
  async getKnowledgeBaseArticles(category?: string, limit: number = 10) {
    const articles = await prisma.knowledgeBase.findMany({
      where: {
        isPublished: true,
        ...(category && { category }),
      },
      select: {
        id: true,
        title: true,
        content: true,
        imageUrl: true,
        category: true,
        viewCount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return articles;
  }

  /**
   * Get single knowledge base article
   */
  async getKnowledgeBaseArticle(articleId: string) {
    const article = await prisma.knowledgeBase.findUnique({
      where: {
        id: articleId,
        isPublished: true,
      },
    });

    if (!article) {
      throw new AppError('Article not found', 404);
    }

    // Increment view count
    await prisma.knowledgeBase.update({
      where: { id: articleId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return article;
  }

  /**
   * Get vaccination history with status (for Child Profile page)
   * @param childId - Child ID
   * @param parentId - Parent ID
   * @param status - status type: 'pending' | 'upcoming' | 'completed' | 'all'
   */
  async getVaccinationHistory(
    childId: string,
    parentId: string | null,
    status?: 'pending' | 'upcoming' | 'completed'
  ) {
    // Build query based on whether parentId is provided (parent) or not (admin)
    const whereClause: any = {
      id: childId,
      isActive: true,
    };

    // If parentId provided, verify child belongs to parent
    if (parentId) {
      whereClause.parentId = parentId;
    }

    const child = await prisma.child.findFirst({
      where: whereClause,
    });

    if (!child) {
      throw new AppError(parentId ? 'Child not found or does not belong to you' : 'Child not found', 404);
    }

    // Calculate child's age in days
    const today = new Date();
    const birthDate = new Date(child.dateOfBirth);
    const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));

    // Get all vaccine schedules
    const allSchedules = await prisma.vaccineSchedule.findMany({
      where: {
        vaccine: {
          isActive: true,
        },
      },
      include: {
        vaccine: true,
      },
      orderBy: {
        ageInDays: 'asc',
      },
    });

    // Get completed vaccination records with full details
    const completedRecords = await prisma.vaccinationRecord.findMany({
      where: { childId },
      include: {
        vaccine: true,
        medicalStaff: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            role: true,
            specialization: true,
            profilePhoto: true,
          },
        },
        vaccinationCenter: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        appointment: {
          include: {
            vaccinationCenter: {
              select: {
                id: true,
                name: true,
                address: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        administeredDate: 'desc',
      },
    });

    // Filter pending schedules (not completed)
    const pendingSchedules = allSchedules.filter(schedule => {
      return !completedRecords.some(
        record =>
          record.vaccineId === schedule.vaccineId &&
          record.doseNumber === schedule.doseNumber
      );
    });

    // Prepare pending vaccines
    const pendingVaccines = pendingSchedules.map(schedule => ({
      scheduleId: schedule.id,
      vaccine: {
        id: schedule.vaccine.id,
        name: schedule.vaccine.name,
        // manufacturer: schedule.vaccine.manufacturer,
        description: schedule.vaccine.description,
      },
      doseNumber: schedule.doseNumber,
      ageGroupLabel: schedule.ageGroupLabel,
      ageInDays: schedule.ageInDays,
      dueDate: new Date(birthDate.getTime() + schedule.ageInDays * 24 * 60 * 60 * 1000),
      isOverdue: schedule.ageInDays < ageInDays,
      isRequired: schedule.isRequired,
      status: 'PENDING',
    }));

    // Prepare upcoming vaccines (next 30 days)
    const upcomingVaccines = pendingSchedules
      .filter(
        schedule =>
          schedule.ageInDays > ageInDays &&
          schedule.ageInDays <= ageInDays + 30
      )
      .map(schedule => ({
        scheduleId: schedule.id,
        vaccine: {
          id: schedule.vaccine.id,
          name: schedule.vaccine.name,
          // manufacturer: schedule.vaccine.manufacturer,
          description: schedule.vaccine.description,
        },
        doseNumber: schedule.doseNumber,
        ageGroupLabel: schedule.ageGroupLabel,
        ageInDays: schedule.ageInDays,
        dueDate: new Date(birthDate.getTime() + schedule.ageInDays * 24 * 60 * 60 * 1000),
        daysUntilDue: schedule.ageInDays - ageInDays,
        isRequired: schedule.isRequired,
        status: 'UPCOMING',
      }));

    // Prepare completed vaccines with full details for UI
    const completedVaccines = completedRecords.map(record => {
      // Get vaccination center from direct relation or through appointment
      const center = record.vaccinationCenter || record.appointment?.vaccinationCenter || null;

      // Find matching schedule for age group label
      const matchingSchedule = allSchedules.find(
        s => s.vaccineId === record.vaccineId && s.doseNumber === record.doseNumber
      );

      // Format administered date
      const adminDate = new Date(record.administeredDate);
      const dateFormatted = adminDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      const timeFormatted = adminDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      return {
        recordId: record.id,
        vaccine: {
          id: record.vaccine.id,
          name: record.vaccine.name,
          // manufacturer: record.vaccine.manufacturer,
          description: record.vaccine.description,
        },
        doseNumber: record.doseNumber,
        doseLabel: this.getDoseLabel(record.doseNumber),
        ageGroupLabel: matchingSchedule?.ageGroupLabel || null,
        administeredDate: record.administeredDate,
        dateFormatted: dateFormatted,
        timeFormatted: timeFormatted,
        dateTimeFormatted: `${dateFormatted}, ${timeFormatted}`,
        batchNumber: record.vaccine?.batchNumber || null,
        // Vaccination center details
        vaccinationCenter: center ? {
          id: center.id,
          name: center.name,
          address: center.address,
          phone: center.phone,
          fullAddress: center.address,
        } : null,
        // Medical staff details
        medicalStaff: record.medicalStaff ? {
          id: record.medicalStaff.id,
          fullName: record.medicalStaff.fullName,
          displayName: record.medicalStaff.role === 'DOCTOR'
            ? `Dr. ${record.medicalStaff.firstName || record.medicalStaff.fullName}`
            : record.medicalStaff.fullName,
          role: record.medicalStaff.role,
          specialization: record.medicalStaff.specialization,
          profilePhoto: record.medicalStaff.profilePhoto,
        } : null,
        // Flags
        completedByMedicalStaff: !!record.administeredBy,
        completedByParent: !record.administeredBy,
        reactions: record.reactions,
        notes: record.notes,
        status: 'COMPLETED',
      };
    });

    // Calculate statistics
    const totalVaccines = allSchedules.length;
    const completedCount = completedRecords.length;
    const pendingCount = pendingSchedules.length;
    const upcomingCount = upcomingVaccines.length;

    const statistics = {
      total: totalVaccines,
      completed: completedCount,
      pending: pendingCount,
      upcoming: upcomingCount,
      completionPercentage: totalVaccines > 0 ? Math.round((completedCount / totalVaccines) * 100) : 0,
    };

    // If no status specified, return all data
    if (!status) {
      return {
        statistics,
        pendingVaccines,
        upcomingVaccines,
        completedVaccines,
      };
    }

    // Return specific status data with dynamic array name
    if (status === 'pending') {
      return {
        filterStatus: 'pending',
        statistics,
        vaccines: pendingVaccines,
      };
    } else if (status === 'upcoming') {
      return {
        filterStatus: 'upcoming',
        statistics,
        vaccines: upcomingVaccines,
      };
    } else if (status === 'completed') {
      return {
        filterStatus: 'completed',
        statistics,
        vaccines: completedVaccines,
      };
    }

    // Fallback (should never reach here)
    return {
      statistics,
      pendingVaccines,
      upcomingVaccines,
      completedVaccines,
    };
  }

}
