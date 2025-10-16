import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BMP } from '../../bmp/bmp.entity';
import { GeographicArea } from '../../geographic-area/geographic-area.entity';
import { Goal } from '../../goal/goal.entity';
import { ImplementationActivity } from '../../implementation/implementation-activity.entity';
import { MonitoringMetric } from '../../monitoring/monitoring-metric.entity';
import { OutreachActivity } from '../../outreach/outreach-activity.entity';

type ExtractedReport = {
  summary: {
    totalGoals: number;
    totalBMPs: number;
    completionRate: number; // 0..100
  };
  goals: Goal[];
  bmps: BMP[];
  implementation: ImplementationActivity[];
  monitoring: MonitoringMetric[];
  outreach: OutreachActivity[];
  geographicAreas: GeographicArea[];
};

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Goal) private readonly goalsRepo: Repository<Goal>,
    @InjectRepository(BMP) private readonly bmpsRepo: Repository<BMP>,
    @InjectRepository(ImplementationActivity)
    private readonly implRepo: Repository<ImplementationActivity>,
    @InjectRepository(MonitoringMetric)
    private readonly monitoringRepo: Repository<MonitoringMetric>,
    @InjectRepository(OutreachActivity)
    private readonly outreachRepo: Repository<OutreachActivity>,
    @InjectRepository(GeographicArea)
    private readonly geoRepo: Repository<GeographicArea>,
  ) {}

  async getExtractedReportByUploadId(
    uploadId: string,
  ): Promise<ExtractedReport> {
    // NOTE: This assumes each entity has an `uploadId` column.
    // If your schema links via another id (e.g., processedPdfId), adjust the where-clause accordingly.
    const [goals, bmps, implementation, monitoring, outreach, geographicAreas] =
      await Promise.all([
        this.goalsRepo.find({
          where: { uploadId } as any,
        }),
        this.bmpsRepo.find({
          where: { uploadId } as any,
        }),
        this.implRepo.find({
          where: { uploadId } as any,
        }),
        this.monitoringRepo.find({
          where: { uploadId } as any,
        }),
        this.outreachRepo.find({
          where: { uploadId } as any,
        }),
        this.geoRepo.find({
          where: { uploadId } as any,
        }),
      ]);

    const totalGoals = goals.length;
    const totalBMPs = bmps.length;

    // Try to compute completionRate as the average of goal progress percentages when available.
    // Adjust property names if your entity differs (e.g., goal.progress.value + unit "%").
    const progressPercents: number[] = [];
    for (const g of goals as any[]) {
      // Flexible extraction of a percent:
      // 1) g.progressPercent (number 0..100)
      // 2) g.progress?.value with g.progress?.unit.includes('%')
      const p1 =
        typeof g.progressPercent === 'number' ? g.progressPercent : undefined;
      const p2 =
        g.progress &&
        typeof g.progress.value === 'number' &&
        typeof g.progress.unit === 'string' &&
        g.progress.unit.includes('%')
          ? Number(g.progress.value)
          : undefined;

      const pct =
        typeof p1 === 'number' ? p1 : typeof p2 === 'number' ? p2 : undefined;

      if (typeof pct === 'number' && isFinite(pct)) progressPercents.push(pct);
    }

    const completionRate =
      progressPercents.length > 0
        ? Number(
            (
              progressPercents.reduce((a, b) => a + b, 0) /
              progressPercents.length
            ).toFixed(2),
          )
        : 0;

    return {
      summary: {
        totalGoals,
        totalBMPs,
        completionRate,
      },
      goals,
      bmps,
      implementation,
      monitoring,
      outreach,
      geographicAreas,
    };
  }
}
