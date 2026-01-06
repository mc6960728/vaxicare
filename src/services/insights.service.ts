import { prisma } from '../config/database';

export class InsightsService {
  /**
   * Get vaccination insights/analytics data
   * Used for dashboard charts and statistics
   * OPTIMIZED: Uses database aggregation instead of in-memory loops
   */
  async getVaccinationInsights() {
    try {
      // Run all aggregation queries in parallel for better performance
      const [
        totalChildren,
        vaccineCount,
        genderStats,
        vaccinationStatusStats,
        vaccineWiseStats,
        genderVaccinationStats
      ] = await Promise.all([
        // 1. Total active children count
        prisma.child.count({ where: { isActive: true } }),

        // 2. Total active vaccines count
        prisma.vaccine.count({ where: { isActive: true } }),

        // 3. Gender breakdown using groupBy
        prisma.child.groupBy({
          by: ['gender'],
          where: { isActive: true },
          _count: { id: true }
        }),

        // 4. Vaccination status - children grouped by unique vaccine count
        prisma.$queryRaw<Array<{ vaccine_count: bigint; child_count: bigint }>>`
          SELECT
            COALESCE(vr.vaccine_count, 0) as vaccine_count,
            COUNT(c.id) as child_count
          FROM children c
          LEFT JOIN (
            SELECT "childId", COUNT(DISTINCT "vaccineId") as vaccine_count
            FROM vaccination_records
            GROUP BY "childId"
          ) vr ON c.id = vr."childId"
          WHERE c."isActive" = true
          GROUP BY COALESCE(vr.vaccine_count, 0)
        `,

        // 5. Vaccine-wise coverage - count of unique children per vaccine
        prisma.$queryRaw<Array<{ vaccine_id: string; vaccine_name: string; vaccinated_count: bigint }>>`
          SELECT
            v.id as vaccine_id,
            v.name as vaccine_name,
            COUNT(DISTINCT vr."childId") as vaccinated_count
          FROM vaccines v
          LEFT JOIN vaccination_records vr ON v.id = vr."vaccineId"
          WHERE v."isActive" = true
          GROUP BY v.id, v.name
          ORDER BY v.name
        `,

        // 6. Gender-wise vaccination stats
        prisma.$queryRaw<Array<{ gender: string; total: bigint; vaccinated: bigint }>>`
          SELECT
            c.gender,
            COUNT(DISTINCT c.id) as total,
            COUNT(DISTINCT CASE WHEN vr."childId" IS NOT NULL THEN c.id END) as vaccinated
          FROM children c
          LEFT JOIN vaccination_records vr ON c.id = vr."childId"
          WHERE c."isActive" = true AND c.gender IS NOT NULL
          GROUP BY c.gender
        `
      ]);

      if (totalChildren === 0) {
        return this.getEmptyInsightsResponse();
      }

      // Calculate vaccination status from aggregated data
      let fullyVaccinated = 0;
      let partiallyVaccinated = 0;
      let unvaccinated = 0;

      for (const stat of vaccinationStatusStats) {
        const count = Number(stat.child_count);
        const vaccineCountNum = Number(stat.vaccine_count);

        if (vaccineCountNum === 0) {
          unvaccinated = count;
        } else if (vaccineCountNum >= vaccineCount) {
          fullyVaccinated += count;
        } else {
          partiallyVaccinated += count;
        }
      }

      // Calculate percentages
      const fullyVaccinatedPercent = Math.round((fullyVaccinated / totalChildren) * 100);
      const partiallyVaccinatedPercent = Math.round((partiallyVaccinated / totalChildren) * 100);
      const unvaccinatedPercent = 100 - fullyVaccinatedPercent - partiallyVaccinatedPercent;

      // Good health ratio (fully + partially vaccinated)
      const protectedPercent = fullyVaccinatedPercent + partiallyVaccinatedPercent;
      const atRiskPercent = 100 - protectedPercent;

      // Process vaccine-wise coverage
      const vaccineWiseCoverage = vaccineWiseStats.map(stat => ({
        vaccineId: stat.vaccine_id,
        vaccineName: stat.vaccine_name,
        coveragePercent: totalChildren > 0 ? Math.round((Number(stat.vaccinated_count) / totalChildren) * 100) : 0,
        vaccinatedCount: Number(stat.vaccinated_count),
        totalChildren: totalChildren,
      }));

      // Process gender stats
      const genderMap = new Map<string, { total: number; vaccinated: number }>();
      for (const stat of genderVaccinationStats) {
        genderMap.set(stat.gender, {
          total: Number(stat.total),
          vaccinated: Number(stat.vaccinated)
        });
      }

      const maleStats = genderMap.get('MALE') || { total: 0, vaccinated: 0 };
      const femaleStats = genderMap.get('FEMALE') || { total: 0, vaccinated: 0 };

      const demographics = {
        boys: {
          total: maleStats.total,
          vaccinated: maleStats.vaccinated,
          coveragePercent: maleStats.total > 0 ? Math.round((maleStats.vaccinated / maleStats.total) * 100) : 0,
        },
        girls: {
          total: femaleStats.total,
          vaccinated: femaleStats.vaccinated,
          coveragePercent: femaleStats.total > 0 ? Math.round((femaleStats.vaccinated / femaleStats.total) * 100) : 0,
        },
      };

      return {
        message: 'Vaccination insights retrieved successfully',
        generatedAt: new Date().toISOString(),
        totalChildren,

        // Good Health Ratio
        healthRatio: {
          protectedPercent,
          atRiskPercent,
          description: `${protectedPercent}% of children are fully protected after completing all their vaccinations.`,
        },

        // Global Coverage Status (for pie chart)
        globalCoverage: {
          fullyVaccinated: {
            count: fullyVaccinated,
            percent: fullyVaccinatedPercent,
          },
          partiallyVaccinated: {
            count: partiallyVaccinated,
            percent: partiallyVaccinatedPercent,
          },
          unvaccinated: {
            count: unvaccinated,
            percent: unvaccinatedPercent,
          },
        },

        // Vaccine-wise Coverage (for bar chart)
        vaccineWiseCoverage,

        // Coverage by Demographics (for bar chart)
        demographicsCoverage: demographics,
      };
    } catch (error) {
      console.error('Error fetching vaccination insights:', error);
      throw error;
    }
  }

  /**
   * Get insights for a specific vaccination center
   */
  async getClinicInsights(clinicId: string) {
    try {
      // Verify clinic exists
      const clinic = await prisma.vaccinationCenter.findUnique({
        where: { id: clinicId },
        select: { id: true, name: true },
      });

      if (!clinic) {
        throw new Error('Vaccination center not found');
      }

      // Get all appointments for this clinic
      const appointments = await prisma.appointment.findMany({
        where: { clinicId },
        select: {
          id: true,
          status: true,
          childId: true,
          child: {
            select: {
              id: true,
              gender: true,
            },
          },
        },
      });

      // Get unique children who visited this clinic
      const uniqueChildIds = [...new Set(appointments.map(a => a.childId))];
      const totalChildren = uniqueChildIds.length;

      // Get vaccination records for this clinic
      const vaccinationRecords = await prisma.vaccinationRecord.findMany({
        where: {
          childId: { in: uniqueChildIds },
        },
        select: {
          childId: true,
          vaccineId: true,
          vaccine: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Calculate stats
      const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;
      const scheduledAppointments = appointments.filter(a => a.status === 'SCHEDULED').length;
      const cancelledAppointments = appointments.filter(a => a.status === 'CANCELLED').length;

      // Vaccine-wise coverage for this clinic
      const vaccineMap = new Map<string, { name: string; count: number }>();
      for (const record of vaccinationRecords) {
        const existing = vaccineMap.get(record.vaccineId);
        if (existing) {
          existing.count++;
        } else {
          vaccineMap.set(record.vaccineId, {
            name: record.vaccine.name,
            count: 1,
          });
        }
      }

      const vaccineWiseCoverage = Array.from(vaccineMap.entries()).map(([id, stat]) => ({
        vaccineId: id,
        vaccineName: stat.name,
        administeredCount: stat.count,
        coveragePercent: totalChildren > 0 ? Math.round((stat.count / totalChildren) * 100) : 0,
      }));

      return {
        message: 'Clinic insights retrieved successfully',
        generatedAt: new Date().toISOString(),
        clinic: {
          id: clinic.id,
          name: clinic.name,
        },
        summary: {
          totalChildrenServed: totalChildren,
          totalAppointments: appointments.length,
          completedAppointments,
          scheduledAppointments,
          cancelledAppointments,
          completionRate: appointments.length > 0
            ? Math.round((completedAppointments / appointments.length) * 100)
            : 0,
        },
        vaccineWiseCoverage,
      };
    } catch (error) {
      console.error('Error fetching clinic insights:', error);
      throw error;
    }
  }

  /**
   * Return empty response structure when no data
   */
  private getEmptyInsightsResponse() {
    return {
      message: 'No vaccination data available',
      generatedAt: new Date().toISOString(),
      totalChildren: 0,
      healthRatio: {
        protectedPercent: 0,
        atRiskPercent: 0,
        description: 'No children registered yet.',
      },
      globalCoverage: {
        fullyVaccinated: { count: 0, percent: 0 },
        partiallyVaccinated: { count: 0, percent: 0 },
        unvaccinated: { count: 0, percent: 0 },
      },
      vaccineWiseCoverage: [],
      demographicsCoverage: {
        boys: { total: 0, vaccinated: 0, coveragePercent: 0 },
        girls: { total: 0, vaccinated: 0, coveragePercent: 0 },
      },
    };
  }
}
