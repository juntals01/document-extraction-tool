// frontend/src/app/pdfs/[slug]/page.tsx
import { axiosClient } from '@/lib/api';
import ReportView from './ReportView';

export const dynamic = 'force-dynamic';

type Target = { unit: string | null; value: number | null } | null;
type Progress = { unit: string | null; value: number | null } | null;
type Money = { value: number; currency: string } | null;
type Quantity = { unit: string; value: number } | null;

export type Goal = {
  uuid: string;
  title: string | null;
  description: string | null;
  pollutant: string | null;
  target: Target;
  progress: Progress;
  deadline: string | null;
  location: string | null;
  evidence: string[];
};

export type BMP = {
  uuid: string;
  name: string | null;
  type: string | null;
  quantity: Quantity;
  cost: Money;
  progress: Progress;
  location: string | null;
  responsibleParty: string | null;
  schedule: { start: string | null; end: string | null };
  relatedGoals: string[];
  evidence: string[];
};

export type ImplementationActivity = {
  uuid: string;
  action: string;
  actor: string | null;
  start: string | null;
  end: string | null;
  budget: Money | null;
  status: string | null; // planned | in-progress | completed | null
  progress: Progress;
  dependencies: string[];
  location: string | null;
  evidence: string[];
};

export type MonitoringMetric = {
  uuid: string;
  parameter: string;
  method: string | null;
  frequency: string | null;
  threshold: { unit: string | null; value: number | null } | null;
  progress: Progress;
  location: string | null;
  responsibleParty: string | null;
  evidence: string[];
};

export type OutreachActivity = {
  uuid: string;
  audience: string | null;
  channel: string | null;
  message: string | null;
  kpi: { unit: string | null; value: number | null } | null;
  progress: { unit: string | null; value: number | null } | null;
  schedule: { start: string | null; end: string | null };
  responsibleParty: string | null;
  evidence: string[];
};

export type GeographicArea = {
  id: string;
  name: string;
  huc: string | null;
  coordinates: any;
  description: string | null;
  processedImageIds: string[];
  evidence: string[];
  uploadId: string;
};

export type Report = {
  summary: { totalGoals: number; totalBMPs: number; completionRate: number };
  goals: Goal[];
  bmps: BMP[];
  implementation: ImplementationActivity[];
  monitoring: MonitoringMetric[];
  outreach: OutreachActivity[];
  geographicAreas: GeographicArea[];
};

type UploadMeta = {
  id: string;
  originalName: string;
  slug: string;
  storedName: string;
  path: string;
  size: string;
  mimetype: string;
  createdAt: string;
};

async function getMeta(idOrSlug: string): Promise<UploadMeta> {
  const { data } = await axiosClient.get<UploadMeta>(`/upload/${idOrSlug}`);
  return data;
}
async function getReport(idOrSlug: string): Promise<Report> {
  const { data } = await axiosClient.get<Report>(`/upload/${idOrSlug}/report`);
  return data;
}

export default async function PdfPage({
  params,
}: {
  params: { slug: string };
}) {
  const [meta, report] = await Promise.all([
    getMeta(params.slug),
    getReport(params.slug),
  ]);
  return <ReportView meta={meta} data={report} />;
}
