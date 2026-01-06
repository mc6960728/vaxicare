import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

export class DashboardService {
  /**
   * Get parent dashboard data
   * Returns all data needed for the dashboard screen in a single API call
   * @param parentId - Parent ID from JWT
   * @param childId - Optional child ID to select specific child
   */
  async getParentDashboard(parentId: string, childId?: string) {
    try {
      // 1. Verify parent exists
      const parent = await prisma.parent.findUnique({
        where: { id: parentId },
        select: {
          id: true,
          fullName: true,
          profilePhoto: true,
        },
      });

      if (!parent) {
        throw new AppError('Parent not found', 404);
      }

      // 2. Get all children for this parent
      const children = await prisma.child.findMany({
        where: {
          parentId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          dateOfBirth: true,
          gender: true,
          profilePhoto: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (children.length === 0) {
        return this.getEmptyDashboardResponse(parent);
      }

      // 3. Determine selected child (use provided childId or first child)
      let selectedChild = children[0];
      if (childId) {
        const found = children.find(c => c.id === childId);
        if (found) {
          selectedChild = found;
        }
      }

      // 4. Calculate child's age
      const childAge = this.calculateAge(selectedChild.dateOfBirth);

      // 5. Fetch vaccine schedules once (reused by summary and remaining vaccines)
      const allSchedules = await this.getVaccineSchedules();

      // 6. Run independent queries in parallel for better performance
      const [summary, bookedAppointments, remainingVaccines, healthRatio, knowledgeBase] = await Promise.all([
        this.getVaccinationSummary(selectedChild.id, selectedChild.dateOfBirth, allSchedules),
        this.getBookedAppointments(parentId, selectedChild.id),
        this.getRemainingVaccines(selectedChild.id, selectedChild.dateOfBirth, allSchedules),
        this.getHealthRatio(),
        this.getKnowledgeBaseArticles(),
      ]);

      return {
        message: 'Dashboard data retrieved successfully',
        parent: {
          id: parent.id,
          fullName: parent.fullName,
          profilePhoto: parent.profilePhoto,
        },
        children: children.map(c => ({
          id: c.id,
          name: c.name || 'Unnamed Child',
          age: this.calculateAge(c.dateOfBirth),
          profilePhoto: c.profilePhoto,
        })),
        selectedChild: {
          id: selectedChild.id,
          name: selectedChild.name || 'Unnamed Child',
          age: childAge,
          dateOfBirth: selectedChild.dateOfBirth,
          gender: selectedChild.gender,
          profilePhoto: selectedChild.profilePhoto,
          summary: {
            completed: summary.completedVaccines,
            nextDue: summary.upcomingVaccines,
            pending: summary.remainingVaccines,
          },
        },
        bookedAppointments,
        remainingVaccines,
        healthRatio,
        knowledgeBase,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Dashboard service error:', error);
      throw new AppError('Failed to retrieve dashboard data', 500);
    }
  }

  /**
   * Calculate age string from date of birth
   */
  private calculateAge(dateOfBirth: Date): string {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);

    const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    const ageInMonths = Math.floor(ageInDays / 30);
    const ageInYears = Math.floor(ageInMonths / 12);
    const remainingMonths = ageInMonths % 12;

    if (ageInYears === 0) {
      if (ageInMonths === 0) {
        return `${ageInDays} ${ageInDays === 1 ? 'day' : 'days'} old`;
      }
      return `${ageInMonths} ${ageInMonths === 1 ? 'month' : 'months'} old`;
    } else if (remainingMonths === 0) {
      return `${ageInYears} ${ageInYears === 1 ? 'year' : 'years'} old`;
    } else {
      return `${ageInYears} ${ageInYears === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'} old`;
    }
  }

  /**
   * Get vaccine schedules from database
   */
  private async getVaccineSchedules() {
    return prisma.vaccineSchedule.findMany({
      where: {
        vaccine: { isActive: true },
      },
      include: { vaccine: true },
      orderBy: { ageInDays: 'asc' },
    });
  }

  /**
   * Get vaccination summary for a child
   * @param allSchedules - Pre-fetched vaccine schedules to avoid duplicate DB calls
   */
  private async getVaccinationSummary(childId: string, dateOfBirth: Date, allSchedules: any[]) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));

    // Get completed vaccination records
    const completedRecords = await prisma.vaccinationRecord.findMany({
      where: { childId },
      select: {
        vaccineId: true,
        doseNumber: true,
      },
    });

    // Filter pending schedules
    const pendingSchedules = allSchedules.filter(schedule => {
      return !completedRecords.some(
        record =>
          record.vaccineId === schedule.vaccineId &&
          record.doseNumber === schedule.doseNumber
      );
    });

    // Upcoming vaccines (next 30 days)
    const upcomingSchedules = pendingSchedules.filter(
      schedule => schedule.ageInDays > ageInDays && schedule.ageInDays <= ageInDays + 30
    );

    return {
      totalVaccines: allSchedules.length,
      completedVaccines: completedRecords.length,
      remainingVaccines: pendingSchedules.length,
      upcomingVaccines: upcomingSchedules.length,
    };
  }

  /**
   * Get booked appointments for selected child
   */
  private async getBookedAppointments(parentId: string, childId: string, limit: number = 3) {
    const appointments = await prisma.appointment.findMany({
      where: {
        parentId,
        childId,
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
      include: {
        vaccine: {
          select: {
            id: true,
            name: true,
            dosageCount: true,
          },
        },
        vaccinationCenter: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        medicalStaff: {
          select: {
            id: true,
            fullName: true,
            specialization: true,
          },
        },
        child: {
          select: {
            id: true,
            name: true,
            dateOfBirth: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
      take: limit,
    });

    return appointments.map(apt => {
      // Calculate time until appointment
      const appointmentDate = new Date(apt.scheduledDate);
      const today = new Date();
      const diffTime = appointmentDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.ceil(diffDays / 7);

      let timeUntil = '';
      if (diffDays === 0) {
        timeUntil = 'Today';
      } else if (diffDays === 1) {
        timeUntil = 'Tomorrow';
      } else if (diffDays < 7) {
        timeUntil = `In ${diffDays} days`;
      } else {
        timeUntil = `In ${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'}`;
      }

      return {
        id: apt.id,
        vaccine: {
          id: apt.vaccine.id,
          name: apt.vaccine.name,
          doseNumber: 1, // TODO: Get actual dose number from schedule
        },
        status: apt.status,
        timeUntil,
        scheduledDate: apt.scheduledDate,
        scheduledTime: apt.scheduledTime,
        vaccinationCenter: apt.vaccinationCenter,
        medicalStaff: apt.medicalStaff,
        child: {
          id: apt.child.id,
          name: apt.child.name || 'Unnamed Child',
          age: this.calculateAge(apt.child.dateOfBirth),
        },
      };
    });
  }

  /**
   * Get remaining vaccines (pending) for selected child
   * @param allSchedules - Pre-fetched vaccine schedules to avoid duplicate DB calls
   */
  private async getRemainingVaccines(childId: string, dateOfBirth: Date, allSchedules: any[], limit: number = 5) {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));

    // Get completed records and scheduled appointments in parallel
    const [completedRecords, scheduledAppointments] = await Promise.all([
      prisma.vaccinationRecord.findMany({
        where: { childId },
        select: {
          vaccineId: true,
          doseNumber: true,
        },
      }),
      prisma.appointment.findMany({
        where: {
          childId,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
        select: {
          vaccineId: true,
        },
      }),
    ]);

    // Create Sets for O(1) lookup
    const completedSet = new Set(
      completedRecords.map(r => `${r.vaccineId}-${r.doseNumber}`)
    );
    const scheduledSet = new Set(
      scheduledAppointments.map(a => a.vaccineId)
    );

    // Filter pending schedules (not completed and not already scheduled)
    const pendingSchedules = allSchedules.filter(schedule => {
      const key = `${schedule.vaccineId}-${schedule.doseNumber}`;
      return !completedSet.has(key) && !scheduledSet.has(schedule.vaccineId);
    });

    // Sort by age and take limit
    const sortedPending = pendingSchedules
      .sort((a, b) => a.ageInDays - b.ageInDays)
      .slice(0, limit);

    return sortedPending.map(schedule => {
      const dueDate = new Date(birthDate.getTime() + schedule.ageInDays * 24 * 60 * 60 * 1000);
      const isOverdue = schedule.ageInDays < ageInDays;

      return {
        scheduleId: schedule.id,
        vaccine: {
          id: schedule.vaccine.id,
          name: schedule.vaccine.name,
          description: schedule.vaccine.description,
        },
        doseNumber: schedule.doseNumber,
        ageGroupLabel: schedule.ageGroupLabel,
        dueDate,
        isOverdue,
        status: isOverdue ? 'OVERDUE' : 'PENDING',
      };
    });
  }

  /**
   * Get health ratio from global insights
   * OPTIMIZED: Uses database aggregation instead of fetching all children
   */
  private async getHealthRatio() {
    try {
      // Run aggregation queries in parallel
      const [totalChildren, vaccineCount, vaccinationStats] = await Promise.all([
        // Get total active children count
        prisma.child.count({ where: { isActive: true } }),

        // Get total active vaccines count
        prisma.vaccine.count({ where: { isActive: true } }),

        // Get vaccination status counts using raw SQL aggregation
        prisma.$queryRaw<Array<{ record_count: bigint; child_count: bigint }>>`
          SELECT
            COALESCE(vr.record_count, 0) as record_count,
            COUNT(c.id) as child_count
          FROM children c
          LEFT JOIN (
            SELECT "childId", COUNT(*) as record_count
            FROM vaccination_records
            GROUP BY "childId"
          ) vr ON c.id = vr."childId"
          WHERE c."isActive" = true
          GROUP BY COALESCE(vr.record_count, 0)
        `
      ]);

      if (totalChildren === 0) {
        return {
          protectedPercent: 0,
          atRiskPercent: 0,
          description: 'No children registered yet.',
        };
      }

      // Calculate vaccination status from aggregated data
      let fullyVaccinated = 0;
      let partiallyVaccinated = 0;

      for (const stat of vaccinationStats) {
        const recordCount = Number(stat.record_count);
        const childCount = Number(stat.child_count);

        if (recordCount >= vaccineCount) {
          fullyVaccinated += childCount;
        } else if (recordCount > 0) {
          partiallyVaccinated += childCount;
        }
      }

      // Good health ratio (fully + partially vaccinated)
      const protectedPercent = Math.round(((fullyVaccinated + partiallyVaccinated) / totalChildren) * 100);
      const atRiskPercent = 100 - protectedPercent;

      return {
        protectedPercent,
        atRiskPercent,
        description: `${protectedPercent}% of children are fully protected after completing all their vaccinations.`,
      };
    } catch (error) {
      console.error('Error calculating health ratio:', error);
      return {
        protectedPercent: 0,
        atRiskPercent: 0,
        description: 'Unable to calculate health ratio.',
      };
    }
  }

  /**
   * Get knowledge base articles for dashboard
   */
  private async getKnowledgeBaseArticles(limit: number = 3) {
    try {
      const articles = await prisma.knowledgeBase.findMany({
        where: {
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          imageUrl: true,
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return articles;
    } catch (error) {
      console.error('Error fetching knowledge base articles:', error);
      return [];
    }
  }

  /**
   * Return empty dashboard response when no children
   */
  private getEmptyDashboardResponse(parent: { id: string; fullName: string; profilePhoto: string | null }) {
    return {
      message: 'Dashboard data retrieved successfully',
      parent: {
        id: parent.id,
        fullName: parent.fullName,
        profilePhoto: parent.profilePhoto,
      },
      children: [],
      selectedChild: null,
      bookedAppointments: [],
      remainingVaccines: [],
      healthRatio: {
        protectedPercent: 0,
        atRiskPercent: 0,
        description: 'Add a child to start tracking vaccinations.',
      },
      knowledgeBase: [],
    };
  }
}
