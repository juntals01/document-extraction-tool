// backend/src/processing/services/extraction-persist.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';

import { createHash } from 'crypto';
import { OpenAiService, ReconcileDecision } from 'src/ai/openai.service';
import { BMP } from '../../bmp/bmp.entity';
import { GeographicArea } from '../../geographic-area/geographic-area.entity';
import { Goal } from '../../goal/goal.entity';
import { ImplementationActivity } from '../../implementation/implementation-activity.entity';
import { MonitoringMetric } from '../../monitoring/monitoring-metric.entity';
import { OutreachActivity } from '../../outreach/outreach-activity.entity';

type JsonRecord = Record<string, any>;

@Injectable()
export class ExtractionPersistService {
  private readonly logger = new Logger(ExtractionPersistService.name);

  constructor(
    private readonly openai: OpenAiService,
    @InjectRepository(Goal) private readonly goals: Repository<Goal>,
    @InjectRepository(BMP) private readonly bmps: Repository<BMP>,
    @InjectRepository(ImplementationActivity)
    private readonly impls: Repository<ImplementationActivity>,
    @InjectRepository(MonitoringMetric)
    private readonly metrics: Repository<MonitoringMetric>,
    @InjectRepository(OutreachActivity)
    private readonly outreach: Repository<OutreachActivity>,
    @InjectRepository(GeographicArea)
    private readonly areas: Repository<GeographicArea>,
  ) {}

  // ---------- helpers ----------
  private arr<T = any>(x: unknown): T[] {
    return Array.isArray(x) ? (x as T[]) : [];
  }

  private norm(s?: string | null) {
    return (s ?? '').trim().toLowerCase();
  }

  private slug(...parts: Array<string | null | undefined>): string {
    const base = parts
      .map((p) => (p ?? '').trim().toLowerCase())
      .filter(Boolean)
      .join('|');
    return createHash('sha1').update(base).digest('hex').slice(0, 10);
  }

  private unionArray(a?: any[], b?: any[]) {
    const A = Array.isArray(a) ? a : [];
    const B = Array.isArray(b) ? b : [];
    return Array.from(new Set([...A, ...B]));
  }

  private applyUpdates<T extends JsonRecord>(
    existing: T,
    updates?: JsonRecord | null,
  ): T {
    if (!updates || typeof updates !== 'object') return existing;
    const next: any = { ...existing };
    for (const [k, v] of Object.entries(updates)) {
      if (Array.isArray(v) && Array.isArray(next[k])) {
        next[k] = this.unionArray(next[k], v);
      } else if (v !== undefined) {
        next[k] = v;
      }
    }
    return next as T;
  }

  // ---------- reconciliation ----------
  private async reconcileOne<T extends ObjectLiteral>(
    entityLabel: string,
    repo: Repository<T>,
    uploadId: string,
    incoming: JsonRecord,
    pickKey: (row: T) => string,
    pickKeyFromIncoming: (incoming: JsonRecord) => string,
    mapToRow: (incoming: JsonRecord) => Partial<T>,
  ): Promise<void> {
    const existingRows = await repo.find({ where: { uploadId } as any });

    const incKey = pickKeyFromIncoming(incoming);
    const candidate =
      existingRows.find((r) => this.norm(pickKey(r)) === this.norm(incKey)) ??
      null;

    if (!candidate) {
      const decision =
        (await this.openai.decideMerge(entityLabel, {}, incoming)) ||
        ({ action: 'insert' } as ReconcileDecision);

      if (decision.action === 'ignore') return;

      const toSave = mapToRow(incoming);
      await repo.save({ ...(toSave as any), uploadId } as any);
      return;
    }

    const decision = await this.openai.decideMerge(
      entityLabel,
      candidate as any,
      incoming,
    );

    if (!decision) {
      const conservative = this.applyUpdates(candidate as any, {
        evidence: this.unionArray(
          (candidate as any).evidence,
          incoming?.evidence,
        ),
        relatedGoals: this.unionArray(
          (candidate as any).relatedGoals,
          incoming?.relatedGoals,
        ),
      });
      await repo.save(conservative as any);
      return;
    }

    if (decision.action === 'ignore') return;

    if (decision.action === 'insert') {
      const toSave = mapToRow(incoming);
      await repo.save({ ...(toSave as any), uploadId } as any);
      return;
    }

    if (decision.action === 'match' || decision.action === 'update') {
      const merged = this.applyUpdates(
        candidate as any,
        decision.updates ?? null,
      );
      await repo.save(merged as any);
    }
  }

  // ---------- entrypoint ----------
  async saveFromAiResult(params: {
    uploadId: string;
    result: any;
    processedImageIds?: string[] | null;
  }): Promise<void> {
    const { uploadId, result, processedImageIds = null } = params;

    const goals = this.arr(result?.goals);
    const bmps = this.arr(result?.bmps);
    const impls = this.arr(result?.implementation);
    const metrics = this.arr(result?.monitoring);
    const outreaches = this.arr(result?.outreach);
    const areas = this.arr(result?.geographicAreas);

    // GOALS
    for (const g of goals) {
      await this.reconcileOne(
        'goal',
        this.goals,
        uploadId,
        g,
        (row) => (row as any).title ?? (row as any).id ?? '',
        (x) => x?.title ?? x?.id ?? '',
        (x) => ({
          uploadId,
          title: x?.title ?? null,
          description: x?.description ?? '',
          pollutant: x?.pollutant ?? null,
          target: x?.target ?? null,
          progress: x?.progress ?? null,
          deadline: x?.deadline ?? null,
          location: x?.location ?? null,
          evidence: Array.isArray(x?.evidence) ? x.evidence : [],
        }),
      );
    }

    // BMPS
    for (const b of bmps) {
      await this.reconcileOne(
        'bmp',
        this.bmps,
        uploadId,
        b,
        (row) => (row as any).name ?? (row as any).id ?? '',
        (x) => x?.name ?? x?.id ?? '',
        (x) => ({
          uploadId,
          name: x?.name ?? null,
          type: x?.type ?? null,
          quantity: x?.quantity ?? null,
          cost: x?.cost ?? null,
          progress: x?.progress ?? null,
          location: x?.location ?? null,
          responsibleParty: x?.responsibleParty ?? null,
          schedule: x?.schedule ?? { start: null, end: null },
          relatedGoals: Array.isArray(x?.relatedGoals) ? x.relatedGoals : [],
          evidence: Array.isArray(x?.evidence) ? x.evidence : [],
        }),
      );
    }

    // IMPLEMENTATION
    for (const a of impls) {
      await this.reconcileOne(
        'implementation',
        this.impls,
        uploadId,
        a,
        (row) => (row as any).action ?? (row as any).id ?? '',
        (x) => x?.action ?? x?.id ?? '',
        (x) => ({
          uploadId,
          action: x?.action ?? '',
          actor: x?.actor ?? null,
          start: x?.start ?? null,
          end: x?.end ?? null,
          budget: x?.budget ?? null,
          status: x?.status ?? null,
          progress: x?.progress ?? null,
          dependencies: Array.isArray(x?.dependencies) ? x?.dependencies : [],
          location: x?.location ?? null,
          evidence: Array.isArray(x?.evidence) ? x?.evidence : [],
        }),
      );
    }

    // MONITORING
    for (const m of metrics) {
      await this.reconcileOne(
        'monitoring',
        this.metrics,
        uploadId,
        m,
        (row) => (row as any).parameter ?? (row as any).id ?? '',
        (x) => x?.parameter ?? x?.id ?? '',
        (x) => ({
          uploadId,
          parameter: x?.parameter ?? '',
          method: x?.method ?? null,
          frequency: x?.frequency ?? null,
          threshold: x?.threshold ?? null,
          progress: x?.progress ?? null,
          location: x?.location ?? null,
          responsibleParty: x?.responsibleParty ?? null,
          evidence: Array.isArray(x?.evidence) ? x?.evidence : [],
        }),
      );
    }

    // OUTREACH
    for (const o of outreaches) {
      await this.reconcileOne(
        'outreach',
        this.outreach,
        uploadId,
        o,
        (row) =>
          `${(row as any).audience ?? ''}|${(row as any).channel ?? ''}` ||
          (row as any).id ||
          '',
        (x) => `${x?.audience ?? ''}|${x?.channel ?? ''}` || x?.id || '',
        (x) => ({
          uploadId,
          audience: x?.audience ?? null,
          channel: x?.channel ?? null,
          message: x?.message ?? null,
          kpi: x?.kpi ?? null,
          progress: x?.progress ?? null,
          schedule: x?.schedule ?? { start: null, end: null },
          responsibleParty: x?.responsibleParty ?? null,
          evidence: Array.isArray(x?.evidence) ? x?.evidence : [],
        }),
      );
    }

    // GEOGRAPHIC AREAS
    for (const ga of areas) {
      await this.reconcileOne(
        'geographicArea',
        this.areas,
        uploadId,
        ga,
        (row) => (row as any).name ?? (row as any).id ?? '',
        (x) => x?.name ?? x?.id ?? '',
        (x) => ({
          uploadId,
          name: (x?.name ?? null)?.trim() || null,
          huc: x?.huc ?? null,
          coordinates: Array.isArray(x?.coordinates) ? x.coordinates : null,
          description: x?.description ?? null,
          evidence: Array.isArray(x?.evidence) ? x.evidence : [],
          processedImageIds: Array.isArray(processedImageIds)
            ? processedImageIds
            : null,
        }),
      );
    }
  }
}
