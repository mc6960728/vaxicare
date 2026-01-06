import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { Gender, BloodGroup } from '@prisma/client';

export interface AddChildInput {
  name?: string;
  dateOfBirth: Date;
  gender: Gender;
  profilePhoto?: string;
  weightKg?: number;
  heightCm?: number;
  bloodGroup?: BloodGroup;
  allergies?: string[];
  pediatrician?: string;
  medicalConditions?: string[];
  specialNotes?: string;
}

export class ChildService {
  /**
   * Add a new child
   */
  async addChild(parentId: string, data: AddChildInput) {
    try {
      // Verify parent exists
      const parent = await prisma.parent.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        throw new AppError('Parent not found', 404);
      }

      if (parent.status !== 'ACTIVE') {
        throw new AppError('Parent account is not active', 403);
      }

      // Check for duplicate child (same name and date of birth for same parent)
      if (data.name) {
        const existingChild = await prisma.child.findFirst({
          where: {
            parentId,
            name: data.name,
            dateOfBirth: data.dateOfBirth,
            isActive: true,
          },
        });

        if (existingChild) {
          throw new AppError('A child with this name and date of birth already exists', 409);
        }
      }

      // Validate minimum gap between children (biological constraint)
      // Minimum gap: 9 months (270 days) for natural pregnancy
      // const existingChildren = await prisma.child.findMany({
      //   where: {
      //     parentId,
      //     isActive: true,
      //   },
      //   select: {
      //     dateOfBirth: true,
      //     name: true,
      //   },
      //   orderBy: {
      //     dateOfBirth: 'desc',
      //   },
      // });

      // if (existingChildren.length > 0) {
        // const newChildDOB = new Date(data.dateOfBirth);

        // for (const existingChild of existingChildren) {
        //   const existingDOB = new Date(existingChild.dateOfBirth);
        //   const daysDifference = Math.abs((newChildDOB.getTime() - existingDOB.getTime()) / (1000 * 60 * 60 * 24));

          // Minimum 270 days (9 months) gap required
          // const minGapDays = 270;

          // if (daysDifference < minGapDays) {
          //   const monthsGap = Math.floor(daysDifference / 30);
          //   throw new AppError(
          //     `Minimum gap of 9 months required between children. Current gap with ${existingChild.name || 'existing child'} is only ${monthsGap} months.`,
          //     400
          //   );
          // }
        // }
      // }

      // Create child
      const child = await prisma.child.create({
        data: {
          parentId,
          name: data.name || '',
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          profilePhoto: data.profilePhoto,
          weightKg: data.weightKg,
          heightCm: data.heightCm,
          bloodGroup: data.bloodGroup,
          allergies: data.allergies || [],
          pediatrician: data.pediatrician,
          medicalConditions: data.medicalConditions || [],
          specialNotes: data.specialNotes,
          isActive: true,
        },
        include: {
          parent: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              relationWithChild: true,
            },
          },
        },
      });

      return {
        message: 'Child added successfully',
        child,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to add child', 500);
    }
  }

  /**
   * Get all children for a parent with vaccination summary
   * OPTIMIZED: Batch fetch vaccination records to avoid N+1 queries
   */
  async getChildrenByParent(parentId: string) {
    try {
      // Get children with their vaccination records in a single query
      const children = await prisma.child.findMany({
        where: {
          parentId,
          isActive: true,
        },
        include: {
          vaccinationRecords: {
            select: {
              vaccineId: true,
              doseNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Get vaccine schedules from database
      const allSchedules = await this.getVaccineSchedules();

      // Calculate summary for each child using already-fetched data
      const childrenWithSummary = children.map((child) => {
        const summary = this.calculateVaccinationSummaryFromData(
          child.vaccinationRecords,
          allSchedules,
          child.dateOfBirth
        );

        // Remove vaccinationRecords from response (not needed in output)
        const { vaccinationRecords, ...childData } = child;

        return {
          ...childData,
          vaccinationSummary: summary,
        };
      });

      return {
        message: 'Children retrieved successfully',
        count: childrenWithSummary.length,
        children: childrenWithSummary,
      };
    } catch (error) {
      throw new AppError('Failed to retrieve children', 500);
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
   * Calculate vaccination summary from pre-fetched data (no additional DB queries)
   */
  private calculateVaccinationSummaryFromData(
    completedRecords: { vaccineId: string; doseNumber: number }[],
    allSchedules: any[],
    dateOfBirth: Date
  ) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));

    // Create Set for O(1) lookup
    const completedSet = new Set(
      completedRecords.map(r => `${r.vaccineId}-${r.doseNumber}`)
    );

    // Filter pending schedules
    const pendingSchedules = allSchedules.filter(schedule => {
      const key = `${schedule.vaccineId}-${schedule.doseNumber}`;
      return !completedSet.has(key);
    });

    // Overdue vaccines
    const overdueSchedules = pendingSchedules.filter(s => s.ageInDays < ageInDays);

    // Upcoming vaccines (next 30 days)
    const upcomingSchedules = pendingSchedules.filter(
      s => s.ageInDays > ageInDays && s.ageInDays <= ageInDays + 30
    );

    // Find next due vaccine
    let nextDueDate: Date | null = null;
    let nextVaccineName: string | null = null;
    const nextSchedule = pendingSchedules.find(s => s.ageInDays > ageInDays);

    if (nextSchedule) {
      nextDueDate = new Date(birthDate.getTime() + nextSchedule.ageInDays * 24 * 60 * 60 * 1000);
      nextVaccineName = nextSchedule.vaccineName;
    }

    const isAllCompleted = pendingSchedules.length === 0;

    // Format status message
    let statusMessage: string;
    if (isAllCompleted) {
      statusMessage = 'All completed';
    } else if (overdueSchedules.length > 0 && !nextDueDate) {
      statusMessage = `${overdueSchedules.length} overdue vaccine${overdueSchedules.length > 1 ? 's' : ''}`;
    } else if (nextDueDate) {
      const diffDays = Math.ceil((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        statusMessage = 'Due today';
      } else if (diffDays <= 30) {
        statusMessage = `Due in ${diffDays} days`;
      } else {
        const day = String(nextDueDate.getDate()).padStart(2, '0');
        const month = String(nextDueDate.getMonth() + 1).padStart(2, '0');
        const year = nextDueDate.getFullYear();
        statusMessage = `Next due: ${day}/${month}/${year}`;
      }
    } else {
      statusMessage = 'No upcoming vaccines';
    }

    return {
      totalVaccines: allSchedules.length,
      completedVaccines: completedRecords.length,
      overdueVaccines: overdueSchedules.length,
      remainingVaccines: pendingSchedules.length,
      upcomingVaccines: upcomingSchedules.length,
      nextDueDate,
      nextVaccineName,
      isAllCompleted,
      statusMessage,
    };
  }

  /**
   * Get vaccination summary for a child
   * Returns: completion status, next due date, and remaining vaccines count
   */
  private async getChildVaccinationSummary(childId: string, dateOfBirth: Date) {
    try {
      // Calculate child's age in days
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));

      // Run independent queries in parallel for better performance
      const [allSchedules, completedRecords] = await Promise.all([
        // Get ALL vaccine schedules
        prisma.vaccineSchedule.findMany({
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
        }),
        // Get completed vaccination records
        prisma.vaccinationRecord.findMany({
          where: { childId },
          select: {
            vaccineId: true,
            doseNumber: true,
          },
        }),
      ]);

      // Filter pending schedules (not completed)
      const pendingSchedules = allSchedules.filter(schedule => {
        return !completedRecords.some(
          record =>
            record.vaccineId === schedule.vaccineId &&
            record.doseNumber === schedule.doseNumber
        );
      });

      // 1. OVERDUE/MISSED VACCINES (past due date, not completed)
      const overdueSchedules = pendingSchedules.filter(
        schedule => schedule.ageInDays < ageInDays
      );

      // 2. DUE VACCINES (should be taken now based on current age)
      const dueSchedules = pendingSchedules.filter(
        schedule => schedule.ageInDays <= ageInDays
      );

      // 3. UPCOMING VACCINES (next 30 days from current age)
      const upcomingSchedules = pendingSchedules.filter(
        schedule => schedule.ageInDays > ageInDays &&
                   schedule.ageInDays <= ageInDays + 30
      );

      // Calculate totals
      const totalVaccines = allSchedules.length; // Total vaccine schedules
      const completedVaccines = completedRecords.length;
      const overdueVaccines = overdueSchedules.length; // Missed vaccines
      const remainingVaccines = pendingSchedules.length; // All pending (overdue + future)
      const upcomingVaccines = upcomingSchedules.length; // Next 30 days

      // Get the NEXT UPCOMING vaccine (after current age, not overdue ones)
      let nextDueDate: Date | null = null;
      let nextVaccineName: string | null = null;
      let isAllCompleted = false;

      if (pendingSchedules.length === 0) {
        // All vaccines completed
        isAllCompleted = true;
      } else {
        // Find the next vaccine AFTER current age (not overdue)
        const nextSchedule = pendingSchedules.find(s => s.ageInDays > ageInDays);

        if (nextSchedule) {
          nextDueDate = new Date(birthDate.getTime() + nextSchedule.ageInDays * 24 * 60 * 60 * 1000);
          nextVaccineName = nextSchedule.vaccineName;
        }
      }

      // Format the status message
      let statusMessage: string;
      if (isAllCompleted) {
        statusMessage = 'All completed';
      } else if (overdueVaccines > 0 && !nextDueDate) {
        // Only overdue vaccines remain, no upcoming ones
        statusMessage = `${overdueVaccines} overdue vaccine${overdueVaccines > 1 ? 's' : ''}`;
      } else if (nextDueDate) {
        const diffTime = nextDueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          statusMessage = 'Due today';
        } else if (diffDays <= 30) {
          statusMessage = `Due in ${diffDays} days`;
        } else {
          // Format as DD/MM/YYYY
          const day = String(nextDueDate.getDate()).padStart(2, '0');
          const month = String(nextDueDate.getMonth() + 1).padStart(2, '0');
          const year = nextDueDate.getFullYear();
          statusMessage = `Next due: ${day}/${month}/${year}`;
        }
      } else {
        statusMessage = 'No upcoming vaccines';
      }

      return {
        totalVaccines,
        completedVaccines,
        overdueVaccines,
        remainingVaccines,
        upcomingVaccines, // Next 30 days ke vaccines
        nextDueDate,
        nextVaccineName,
        isAllCompleted,
        statusMessage,
      };
    } catch (error) {
      console.error('Error calculating vaccination summary:', error);
      // Return default values on error
      return {
        totalVaccines: 0,
        completedVaccines: 0,
        remainingVaccines: 0,
        upcomingVaccines: 0,
        nextDueDate: null,
        nextVaccineName: null,
        isAllCompleted: false,
        statusMessage: 'Unable to calculate',
      };
    }
  }

  /**
   * Get child by ID
   */
  async getChildById(childId: string, parentId: string) {
    try {
      const child = await prisma.child.findFirst({
        where: {
          id: childId,
          parentId,
          isActive: true,
        },
        include: {
          parent: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              relationWithChild: true,
            },
          },
        },
      });

      if (!child) {
        throw new AppError('Child not found', 404);
      }

      return {
        message: 'Child retrieved successfully',
        child,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve child', 500);
    }
  }

  /**
   * Update child information
   */
  async updateChild(childId: string, parentId: string, data: Partial<AddChildInput>) {
    try {
      // Verify child belongs to parent
      const existingChild = await prisma.child.findFirst({
        where: {
          id: childId,
          parentId,
          isActive: true,
        },
      });

      if (!existingChild) {
        throw new AppError('Child not found', 404);
      }

      // Check for duplicate if name or dateOfBirth is being updated
      if (data.name || data.dateOfBirth) {
        const duplicateChild = await prisma.child.findFirst({
          where: {
            parentId,
            name: data.name || existingChild.name,
            dateOfBirth: data.dateOfBirth || existingChild.dateOfBirth,
            isActive: true,
            id: { not: childId }, // Exclude current child
          },
        });

        if (duplicateChild) {
          throw new AppError('A child with this name and date of birth already exists', 409);
        }
      }

      // Update child
      const updatedChild = await prisma.child.update({
        where: { id: childId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
          ...(data.gender && { gender: data.gender }),
          ...(data.profilePhoto !== undefined && { profilePhoto: data.profilePhoto }),
          ...(data.weightKg !== undefined && { weightKg: data.weightKg }),
          ...(data.heightCm !== undefined && { heightCm: data.heightCm }),
          ...(data.bloodGroup !== undefined && { bloodGroup: data.bloodGroup }),
          ...(data.allergies !== undefined && { allergies: data.allergies }),
          ...(data.pediatrician !== undefined && { pediatrician: data.pediatrician }),
          ...(data.medicalConditions !== undefined && { medicalConditions: data.medicalConditions }),
          ...(data.specialNotes !== undefined && { specialNotes: data.specialNotes }),
        },
        include: {
          parent: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              relationWithChild: true,
            },
          },
        },
      });

      return {
        message: 'Child updated successfully',
        child: updatedChild,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update child', 500);
    }
  }

  /**
   * Delete child (soft delete)
   */
  async deleteChild(childId: string, parentId: string) {
    try {
      // Verify child belongs to parent
      const existingChild = await prisma.child.findFirst({
        where: {
          id: childId,
          parentId,
          isActive: true,
        },
      });

      if (!existingChild) {
        throw new AppError('Child not found', 404);
      }

      // Soft delete by setting isActive to false
      await prisma.child.update({
        where: { id: childId },
        data: { isActive: false },
      });

      return {
        message: 'Child deleted successfully',
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete child', 500);
    }
  }

  // ========== ADMIN METHODS ==========

  /**
   * Admin: Add a new child for any parent
   */
  async addChildByAdmin(parentId: string, data: AddChildInput) {
    try {
      // Verify parent exists
      const parent = await prisma.parent.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        throw new AppError('Parent not found', 404);
      }

      // Check for duplicate child (same name and date of birth for same parent)
      if (data.name) {
        const existingChild = await prisma.child.findFirst({
          where: {
            parentId,
            name: data.name,
            dateOfBirth: data.dateOfBirth,
            isActive: true,
          },
        });

        if (existingChild) {
          throw new AppError('A child with this name and date of birth already exists', 409);
        }
      }

      // Create child
      const child = await prisma.child.create({
        data: {
          parentId,
          name: data.name || '',
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          profilePhoto: data.profilePhoto,
          weightKg: data.weightKg,
          heightCm: data.heightCm,
          bloodGroup: data.bloodGroup,
          allergies: data.allergies || [],
          pediatrician: data.pediatrician,
          medicalConditions: data.medicalConditions || [],
          specialNotes: data.specialNotes,
          isActive: true,
        },
        include: {
          parent: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              relationWithChild: true,
            },
          },
        },
      });

      return {
        message: 'Child added successfully',
        child,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to add child', 500);
    }
  }

  /**
   * Admin: Get all children with optional filters and pagination
   */
  async getAllChildrenForAdmin(filters: {
    parentId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {
        isActive: true,
      };

      if (filters.parentId) {
        where.parentId = filters.parentId;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { parent: { fullName: { contains: filters.search, mode: 'insensitive' } } },
          { parent: { phone: { contains: filters.search } } },
        ];
      }

      const [children, total] = await Promise.all([
        prisma.child.findMany({
          where,
          include: {
            parent: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                relationWithChild: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.child.count({ where }),
      ]);

      return {
        message: 'Children retrieved successfully',
        children,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new AppError('Failed to retrieve children', 500);
    }
  }

  /**
   * Admin: Get child by ID (no ownership check)
   */
  async getChildByIdForAdmin(childId: string) {
    try {
      const child = await prisma.child.findFirst({
        where: {
          id: childId,
          isActive: true,
        },
        include: {
          parent: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              relationWithChild: true,
            },
          },
          vaccinationRecords: {
            include: {
              vaccine: {
                select: {
                  id: true,
                  name: true,
                  manufacturer: true,
                },
              },
            },
            orderBy: { administeredDate: 'desc' },
          },
        },
      });

      if (!child) {
        throw new AppError('Child not found', 404);
      }

      return {
        message: 'Child retrieved successfully',
        child,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve child', 500);
    }
  }

  /**
   * Admin: Update child information (no ownership check)
   */
  async updateChildByAdmin(childId: string, data: Partial<AddChildInput>) {
    try {
      const existingChild = await prisma.child.findFirst({
        where: {
          id: childId,
          isActive: true,
        },
      });

      if (!existingChild) {
        throw new AppError('Child not found', 404);
      }

      // Check for duplicate if name or dateOfBirth is being updated
      if (data.name || data.dateOfBirth) {
        const duplicateChild = await prisma.child.findFirst({
          where: {
            parentId: existingChild.parentId,
            name: data.name || existingChild.name,
            dateOfBirth: data.dateOfBirth || existingChild.dateOfBirth,
            isActive: true,
            id: { not: childId },
          },
        });

        if (duplicateChild) {
          throw new AppError('A child with this name and date of birth already exists', 409);
        }
      }

      // Update child
      const updatedChild = await prisma.child.update({
        where: { id: childId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
          ...(data.gender && { gender: data.gender }),
          ...(data.profilePhoto !== undefined && { profilePhoto: data.profilePhoto }),
          ...(data.weightKg !== undefined && { weightKg: data.weightKg }),
          ...(data.heightCm !== undefined && { heightCm: data.heightCm }),
          ...(data.bloodGroup !== undefined && { bloodGroup: data.bloodGroup }),
          ...(data.allergies !== undefined && { allergies: data.allergies }),
          ...(data.pediatrician !== undefined && { pediatrician: data.pediatrician }),
          ...(data.medicalConditions !== undefined && { medicalConditions: data.medicalConditions }),
          ...(data.specialNotes !== undefined && { specialNotes: data.specialNotes }),
        },
        include: {
          parent: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              relationWithChild: true,
            },
          },
        },
      });

      return {
        message: 'Child updated successfully',
        child: updatedChild,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update child', 500);
    }
  }

  /**
   * Admin: Delete child (soft delete, no ownership check)
   */
  async deleteChildByAdmin(childId: string) {
    try {
      const existingChild = await prisma.child.findFirst({
        where: {
          id: childId,
          isActive: true,
        },
      });

      if (!existingChild) {
        throw new AppError('Child not found', 404);
      }

      // Soft delete
      await prisma.child.update({
        where: { id: childId },
        data: { isActive: false },
      });

      return {
        message: 'Child deleted successfully',
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete child', 500);
    }
  }

  /**
   * Mark multiple vaccinations as complete (for parents)
   * RESTRICTION: Parents can only mark vaccines scheduled for 0-30 days (first month)
   *
   * @param parentId - Parent ID from JWT
   * @param childId - Child ID from request body
   * @param scheduleIds - Array of schedule IDs to mark as complete
   */
  async markMultipleVaccinationsComplete(
    parentId: string,
    childId: string,
    scheduleIds: string[]
  ) {
    try {
      // 1. Verify child belongs to parent
      const child = await prisma.child.findFirst({
        where: {
          id: childId,
          parentId: parentId,
          isActive: true,
        },
      });

      if (!child) {
        throw new AppError('Child not found or does not belong to you', 404);
      }

      // 2. Validate scheduleIds array
      if (!scheduleIds || !Array.isArray(scheduleIds) || scheduleIds.length === 0) {
        throw new AppError('At least one scheduleId is required', 400);
      }

      const completed: any[] = [];
      const failed: any[] = [];
      const MAX_AGE_DAYS_FOR_PARENT = 30;

      // 3. Process each schedule
      for (const scheduleId of scheduleIds) {
        try {
          // Get vaccine schedule
          const schedule = await prisma.vaccineSchedule.findUnique({
            where: { id: scheduleId },
            include: {
              vaccine: true,
            },
          });

          if (!schedule) {
            failed.push({
              scheduleId,
              reason: 'Vaccine schedule not found',
            });
            continue;
          }

          // Check age restriction
          if (schedule.ageInDays > MAX_AGE_DAYS_FOR_PARENT) {
            failed.push({
              scheduleId,
              vaccineName: schedule.vaccineName,
              reason: `Parents can only mark vaccines within first month (0-30 days). This vaccine is scheduled for ${schedule.ageGroupLabel}.`,
            });
            continue;
          }

          // Check if already completed
          const existingRecord = await prisma.vaccinationRecord.findFirst({
            where: {
              childId: childId,
              vaccineId: schedule.vaccine.id,
              doseNumber: schedule.doseNumber,
            },
          });

          if (existingRecord) {
            failed.push({
              scheduleId,
              vaccineName: schedule.vaccineName,
              reason: 'Vaccination already marked as complete',
            });
            continue;
          }

          // Create vaccination record
          const vaccinationRecord = await prisma.vaccinationRecord.create({
            data: {
              childId: childId,
              vaccineId: schedule.vaccine.id,
              administeredDate: new Date(),
              doseNumber: schedule.doseNumber,
              notes: 'Marked complete by parent',
            },
          });

          completed.push({
            scheduleId,
            recordId: vaccinationRecord.id,
            vaccineName: schedule.vaccineName,
            doseNumber: schedule.doseNumber,
            ageGroupLabel: schedule.ageGroupLabel,
            administeredDate: vaccinationRecord.administeredDate,
          });
        } catch (err) {
          failed.push({
            scheduleId,
            reason: 'Failed to process vaccination',
          });
        }
      }

      return {
        message: `${completed.length} vaccination${completed.length !== 1 ? 's' : ''} marked as complete`,
        data: {
          totalRequested: scheduleIds.length,
          completedCount: completed.length,
          failedCount: failed.length,
          completed,
          failed,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Mark multiple vaccinations complete error:', error);
      throw new AppError('Failed to mark vaccinations as complete', 500);
    }
  }

}
