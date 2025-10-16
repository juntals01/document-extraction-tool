'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Download,
  FileJson,
  FileSpreadsheet,
  RefreshCcw,
} from 'lucide-react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ImplementationActivity, OutreachActivity, Report } from './page';

function Card({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className='rounded-2xl border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50 shadow-sm hover:shadow-md transition-shadow'>
      <div className='px-5 pt-4'>
        <div className='text-sm font-medium tracking-wide text-foreground/80'>
          {title}
        </div>
      </div>
      <div className='px-5 pb-5 pt-2'>{children}</div>
      {footer ? (
        <div className='border-t px-5 py-3 text-xs text-muted-foreground'>
          {footer}
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className='flex flex-col items-center justify-center rounded-xl border bg-muted/30 p-4'>
      <div className='text-3xl font-semibold tracking-tight'>{value}</div>
      <div className='mt-1 text-[11px] uppercase tracking-wide text-muted-foreground'>
        {label}
      </div>
      {sub ? (
        <div className='mt-1 text-[11px] text-foreground/70'>{sub}</div>
      ) : null}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className='inline-flex items-center rounded-full border bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground'>
      {children}
    </span>
  );
}

function pct(n: number) {
  return `${Math.round(n)}%`;
}
function fmtDate(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString();
}
function fmtQty(q?: { value?: number | null; unit?: string | null } | null) {
  if (!q || q.value == null) return '—';
  return `${q.value}${q.unit ? ` ${q.unit}` : ''}`;
}
function fmtCost(
  c?: { value?: number | null; currency?: string | null } | null
) {
  if (!c || c.value == null) return '—';
  const currency = (c.currency || 'USD').toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(c.value as number);
  } catch {
    return `${c.value} ${currency}`;
  }
}

const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#8dd1e1',
  '#a4de6c',
  '#d0ed57',
];

/** ---------- Export helpers ---------- */
function downloadBlob(
  content: BlobPart,
  fileName: string,
  mime = 'application/octet-stream'
) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportReportJSON(meta: { originalName: string }, data: Report) {
  const base = (meta.originalName || 'report').replace(/\.[^.]+$/, '');
  const fileName = `${base}-report.json`;
  const json = JSON.stringify(data, null, 2);
  downloadBlob(json, fileName, 'application/json');
}

/** quick CSV escape */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str =
    typeof value === 'string'
      ? value
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);

  return /[,"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  headers?: (keyof T)[]
): string {
  if (!rows?.length) return '';

  const keys: (keyof T)[] =
    headers ??
    Array.from(
      rows.reduce<Set<keyof T>>((set, r) => {
        (Object.keys(r) as (keyof T)[]).forEach((k) => set.add(k));
        return set;
      }, new Set<keyof T>())
    );

  const head = (keys as string[]).join(',');
  const body = rows
    .map((r) => keys.map((k) => csvEscape(r[k])).join(','))
    .join('\n');

  return `${head}\n${body}`;
}

function exportBMPsCSV(meta: { originalName: string }, data: Report) {
  const base = (meta.originalName || 'report').replace(/\.[^.]+$/, '');
  const fileName = `${base}-bmps.csv`;
  const rows = data.bmps.map((b) => ({
    uuid: b.uuid,
    name: b.name,
    type: b.type,
    quantity_value: b.quantity?.value ?? '',
    quantity_unit: b.quantity?.unit ?? '',
    cost_value: b.cost?.value ?? '',
    cost_currency: b.cost?.currency ?? '',
    progress_value: b.progress?.value ?? '',
    progress_unit: b.progress?.unit ?? '',
    location: b.location ?? '',
    responsibleParty: b.responsibleParty ?? '',
    schedule_start: b.schedule?.start ?? '',
    schedule_end: b.schedule?.end ?? '',
    relatedGoals: Array.isArray(b.relatedGoals) ? b.relatedGoals.join('|') : '',
    evidence: Array.isArray(b.evidence) ? b.evidence.join(' | ') : '',
  }));
  downloadBlob(toCSV(rows), fileName, 'text/csv');
}

function exportGoalsCSV(meta: { originalName: string }, data: Report) {
  const base = (meta.originalName || 'report').replace(/\.[^.]+$/, '');
  const fileName = `${base}-goals.csv`;
  const rows = data.goals.map((g) => ({
    uuid: g.uuid,
    title: g.title ?? '',
    description: g.description ?? '',
    pollutant: g.pollutant ?? '',
    target_value: g.target?.value ?? '',
    target_unit: g.target?.unit ?? '',
    progress_value: g.progress?.value ?? '',
    progress_unit: g.progress?.unit ?? '',
    deadline: g.deadline ?? '',
    location: g.location ?? '',
    evidence: Array.isArray(g.evidence) ? g.evidence.join(' | ') : '',
  }));
  downloadBlob(toCSV(rows), fileName, 'text/csv');
}

function exportImplementationCSV(meta: { originalName: string }, data: Report) {
  const base = (meta.originalName || 'report').replace(/\.[^.]+$/, '');
  const fileName = `${base}-implementation.csv`;
  const rows = data.implementation.map((i) => ({
    uuid: i.uuid,
    action: i.action ?? '',
    actor: i.actor ?? '',
    status: i.status ?? '',
    location: i.location ?? '',
    start: i.start ?? '',
    end: i.end ?? '',
    progress_value: i.progress?.value ?? '',
    progress_unit: i.progress?.unit ?? '',
  }));
  downloadBlob(toCSV(rows), fileName, 'text/csv');
}

/** ------------------------------------ */

export default function ReportView({
  meta,
  data,
}: {
  meta: { originalName: string; createdAt: string };
  data: Report;
}) {
  // Implementation “Target vs Achieved”
  const totalImpl = data.implementation.length;
  const achievedImpl = data.implementation.filter(
    (i: ImplementationActivity) =>
      (i.status && i.status.toLowerCase() === 'completed') ||
      (i.progress?.value ?? 0) >= 100
  ).length;
  const implSeries = [
    { name: 'Implementation', Target: totalImpl, Achieved: achievedImpl },
  ];

  // Pie: Implementation status distribution
  const statusMap = data.implementation.reduce<Record<string, number>>(
    (acc, it) => {
      const k = (it.status || 'unspecified').toLowerCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    },
    {}
  );
  const statusPie = Object.entries(statusMap).map(([name, value]) => ({
    name,
    value,
  }));

  // KPIs
  const completion = Math.max(
    0,
    Math.min(100, (data.summary?.completionRate ?? 0) * 100)
  );
  const goalsWithTarget = data.goals.filter(
    (g) => (g.target?.value ?? null) !== null
  ).length;
  const bmpsWithQty = data.bmps.filter((b) => b.quantity?.value).length;
  const goalsPct = data.goals.length
    ? (goalsWithTarget / Math.max(1, data.goals.length)) * 100
    : 0;
  const bmpsPct = data.bmps.length ? (bmpsWithQty / data.bmps.length) * 100 : 0;

  return (
    <div className='mx-auto max-w-7xl space-y-8 p-6'>
      {/* Header */}
      <div className='relative overflow-hidden rounded-2xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent'>
        <div className='absolute inset-0 pointer-events-none [mask-image:radial-gradient(200px_200px_at_0%_0%,#000,transparent_70%)]' />
        <div className='flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between'>
          <div className='min-w-0'>
            <h1 className='truncate text-2xl font-semibold tracking-tight'>
              {meta.originalName}
            </h1>
            <p className='text-sm text-muted-foreground'>
              Uploaded {fmtDate(meta.createdAt)}
            </p>

            <h2 className='pt-5'>
              Please allow 5–15 minutes, then refresh the page as data is being
              generated in the background.
            </h2>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              variant='outline'
              className='gap-2'
              onClick={() => exportReportJSON(meta, data)}
            >
              <FileJson className='h-4 w-4' />
              Export JSON
            </Button>
            <Button
              variant='outline'
              className='hidden md:inline-flex gap-2'
              onClick={() => exportBMPsCSV(meta, data)}
              title='Export BMPs as CSV'
            >
              <FileSpreadsheet className='h-4 w-4' />
              BMPs CSV
            </Button>
            <Button
              variant='outline'
              className='hidden md:inline-flex gap-2'
              onClick={() => exportGoalsCSV(meta, data)}
              title='Export Goals as CSV'
            >
              <FileSpreadsheet className='h-4 w-4' />
              Goals CSV
            </Button>
            <Button
              variant='outline'
              className='hidden lg:inline-flex gap-2'
              onClick={() => exportImplementationCSV(meta, data)}
              title='Export Implementation as CSV'
            >
              <Download className='h-4 w-4' />
              Implementation CSV
            </Button>
            <Button asChild variant='ghost' className='gap-2'>
              <Link href='/pdfs'>
                <ArrowLeft className='h-4 w-4' />
                Back to list
              </Link>
            </Button>
            <Button
              className='gap-2 cursor-pointer'
              onClick={() => window.location.reload()}
            >
              <RefreshCcw className='h-4 w-4' />
              Refresh Page
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue='summary' className='w-full space-y-6'>
        <TabsList className='w-full justify-start gap-1 rounded-xl bg-muted/50 p-1'>
          {[
            'summary',
            'goals',
            'benchmarks',
            'implementation',
            'monitoring',
            'outreach',
            'wrias',
            'charts',
          ].map((key) => (
            <TabsTrigger
              key={key}
              value={key}
              className='capitalize rounded-lg px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm'
            >
              {key}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* SUMMARY */}
        <TabsContent value='summary' className='space-y-6'>
          <div className='grid gap-4 md:grid-cols-3'>
            <Card title='Overview'>
              <p className='text-sm leading-relaxed text-muted-foreground'>
                This report tracks goals, BMPs, implementation, monitoring,
                outreach, and geographic areas extracted from the PDF. The
                charts below show a quick status summary and implementation
                progress.
              </p>
            </Card>
            <Card title='Status Summary'>
              <div className='grid grid-cols-3 gap-3'>
                <Stat label='Goals w/ Targets' value={pct(goalsPct)} />
                <Stat label='BMPs w/ Quantity' value={pct(bmpsPct)} />
                <Stat label='Benchmarks Met' value={pct(completion)} />
              </div>
            </Card>
            <Card title='At a Glance'>
              <div className='grid grid-cols-3 gap-3 text-center'>
                <div>
                  <div className='text-xl font-semibold'>
                    {data.goals.length}
                  </div>
                  <div className='text-xs text-muted-foreground'>Goals</div>
                </div>
                <div>
                  <div className='text-xl font-semibold'>
                    {data.bmps.length}
                  </div>
                  <div className='text-xs text-muted-foreground'>BMPs</div>
                </div>
                <div>
                  <div className='text-xl font-semibold'>
                    {data.implementation.length}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Implementation
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className='space-y-4'>
            <h2 className='text-lg font-semibold tracking-tight'>
              Data Visualization
            </h2>

            <Card title='Water Management Implementation'>
              <div className='h-72'>
                <ResponsiveContainer>
                  <BarChart data={implSeries}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='Target' />
                    <Bar dataKey='Achieved' />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title='Benchmark Status Distribution'>
              <div className='h-72'>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={statusPie}
                      nameKey='name'
                      dataKey='value'
                      outerRadius={110}
                    >
                      {statusPie.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* GOALS */}
        <TabsContent value='goals' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold tracking-tight'>Goals</h2>
            <div className='text-xs text-muted-foreground'>
              {data.goals.length} item{data.goals.length === 1 ? '' : 's'}
            </div>
          </div>
          <div className='divide-y rounded-2xl border'>
            {data.goals.map((g) => (
              <div
                key={g.uuid}
                className='group grid gap-2 p-5 transition-colors hover:bg-muted/30'
              >
                <div className='flex flex-wrap items-center gap-2'>
                  <div className='font-medium'>
                    {g.title ?? 'Untitled Goal'}
                  </div>
                  {g.pollutant ? <Chip>{g.pollutant}</Chip> : null}
                  {g.deadline ? <Chip>Deadline {g.deadline}</Chip> : null}
                  {g.target?.value != null ? (
                    <Chip>
                      Target{' '}
                      {g.target.value +
                        (g.target.unit ? ` ${g.target.unit}` : '')}
                    </Chip>
                  ) : null}
                </div>
                {g.description ? (
                  <div className='text-sm leading-relaxed text-muted-foreground'>
                    {g.description}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* BENCHMARKS (BMPs) */}
        <TabsContent value='benchmarks' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold tracking-tight'>
              Benchmarks / BMPs
            </h2>
            <div className='text-xs text-muted-foreground'>
              {data.bmps.length} item{data.bmps.length === 1 ? '' : 's'}
            </div>
          </div>
          <div className='rounded-2xl border'>
            {data.bmps.map((b, idx) => (
              <div
                key={b.uuid}
                className={`grid gap-3 p-5 transition-colors hover:bg-muted/30 md:grid-cols-12 ${
                  idx !== data.bmps.length - 1 ? 'border-b' : ''
                }`}
              >
                {/* Left: Name & Type */}
                <div className='md:col-span-4'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <div className='font-medium'>
                      {b.name ?? 'Untitled BMP'}
                    </div>
                    {b.type ? <Chip>{b.type}</Chip> : null}
                  </div>
                  {Array.isArray(b.relatedGoals) &&
                  b.relatedGoals.length > 0 ? (
                    <div className='mt-2 flex flex-wrap gap-1'>
                      {b.relatedGoals.map((rg: string, i: number) => (
                        <Chip key={`${b.uuid}-rg-${i}`}>Goal {rg}</Chip>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Middle: Numbers */}
                <div className='grid grid-cols-2 gap-3 text-xs text-muted-foreground md:col-span-5'>
                  <div>
                    <div className='uppercase tracking-wide'>Quantity</div>
                    <div className='text-sm font-medium text-foreground'>
                      {fmtQty(b.quantity)}
                    </div>
                  </div>
                  <div>
                    <div className='uppercase tracking-wide'>Cost</div>
                    <div className='text-sm font-medium text-foreground'>
                      {fmtCost(b.cost)}
                    </div>
                  </div>
                  <div>
                    <div className='uppercase tracking-wide'>Progress</div>
                    <div className='text-sm font-medium text-foreground'>
                      {b.progress?.value != null ? pct(b.progress.value) : '—'}
                    </div>
                  </div>
                  <div>
                    <div className='uppercase tracking-wide'>Location</div>
                    <div className='text-sm font-medium text-foreground'>
                      {b.location ?? '—'}
                    </div>
                  </div>
                  <div>
                    <div className='uppercase tracking-wide'>Responsible</div>
                    <div className='text-sm font-medium text-foreground'>
                      {b.responsibleParty ?? '—'}
                    </div>
                  </div>
                  <div>
                    <div className='uppercase tracking-wide'>Schedule</div>
                    <div className='text-sm font-medium text-foreground'>
                      {b.schedule?.start ?? '—'}{' '}
                      {b.schedule?.end ? `→ ${b.schedule.end}` : ''}
                    </div>
                  </div>
                </div>

                {/* Right: Evidence */}
                <div className='md:col-span-3'>
                  <div className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>
                    Evidence
                  </div>
                  {Array.isArray(b.evidence) && b.evidence.length ? (
                    <ul className='list-disc space-y-1 pl-5 text-xs text-muted-foreground'>
                      {b.evidence.map((e: string, i: number) => (
                        <li key={`${b.uuid}-e-${i}`}>{e}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className='text-xs text-muted-foreground'>—</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* IMPLEMENTATION */}
        <TabsContent value='implementation' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold tracking-tight'>
              Implementation
            </h2>
            <div className='text-xs text-muted-foreground'>
              {data.implementation.length} item
              {data.implementation.length === 1 ? '' : 's'}
            </div>
          </div>
          <div className='divide-y rounded-2xl border'>
            {data.implementation.map((i) => (
              <div
                key={i.uuid}
                className='flex flex-col gap-1 p-5 md:flex-row md:items-start md:justify-between'
              >
                <div>
                  <div className='font-medium'>{i.action}</div>
                  <div className='mt-1 text-xs text-muted-foreground'>
                    {i.actor ?? '—'} • {i.location ?? 'Unknown location'}
                  </div>
                </div>
                <div className='text-xs text-muted-foreground md:whitespace-nowrap'>
                  {i.status ?? 'unspecified'} {i.start ? `• ${i.start}` : ''}{' '}
                  {i.end ? `→ ${i.end}` : ''}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* MONITORING */}
        <TabsContent value='monitoring' className='space-y-4'>
          <h2 className='text-lg font-semibold tracking-tight'>Monitoring</h2>
          <div className='divide-y rounded-2xl border'>
            {data.monitoring.map((m) => (
              <div key={m.uuid} className='grid gap-1 p-5'>
                <div className='font-medium'>{m.parameter}</div>
                <div className='text-xs text-muted-foreground'>
                  {m.method ?? '—'} {m.frequency ? `• ${m.frequency}` : ''}{' '}
                  {m.threshold?.value != null
                    ? `• Threshold: ${m.threshold.value}${m.threshold.unit ? ` ${m.threshold.unit}` : ''}`
                    : ''}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* OUTREACH */}
        <TabsContent value='outreach' className='space-y-4'>
          <h2 className='text-lg font-semibold tracking-tight'>Outreach</h2>
          <div className='divide-y rounded-2xl border'>
            {data.outreach.map((o: OutreachActivity) => (
              <div key={o.uuid} className='grid gap-1 p-5'>
                <div className='font-medium'>{o.channel ?? 'Outreach'}</div>
                <div className='text-sm text-foreground/90'>{o.message}</div>
                <div className='text-xs text-muted-foreground'>
                  {o.audience ?? '—'}{' '}
                  {o.kpi?.value != null
                    ? `• KPI: ${o.kpi.value}${o.kpi.unit ? ` ${o.kpi.unit}` : ''}`
                    : ''}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* WRIAs / GEOGRAPHY */}
        <TabsContent value='wrias' className='space-y-4'>
          <h2 className='text-lg font-semibold tracking-tight'>
            WRIAs / Geographic Areas
          </h2>
          <div className='divide-y rounded-2xl border'>
            {data.geographicAreas.map((g) => (
              <div key={g.id} className='grid gap-1 p-5'>
                <div className='font-medium'>{g.name}</div>
                <div className='text-sm text-muted-foreground'>
                  {g.description}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {g.huc ? `HUC: ${g.huc}` : null}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* CHARTS */}
        <TabsContent value='charts' className='space-y-4'>
          <h2 className='text-lg font-semibold tracking-tight'>Charts</h2>
          <div className='grid gap-4 md:grid-cols-3'>
            <Card title='Completion Gauge'>
              <div className='h-64'>
                <ResponsiveContainer>
                  <RadialBarChart
                    innerRadius='60%'
                    outerRadius='100%'
                    data={[
                      {
                        name: 'Completion',
                        value: Math.round(
                          (data.summary?.completionRate ?? 0) * 100
                        ),
                      },
                    ]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar dataKey='value' cornerRadius={8} />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title='Items by Category'>
              <div className='h-64'>
                <ResponsiveContainer>
                  <BarChart
                    data={[
                      { name: 'Goals', value: data.goals.length },
                      { name: 'BMPs', value: data.bmps.length },
                      {
                        name: 'Implementation',
                        value: data.implementation.length,
                      },
                      { name: 'Monitoring', value: data.monitoring.length },
                      { name: 'Outreach', value: data.outreach.length },
                      { name: 'Geography', value: data.geographicAreas.length },
                    ]}
                  >
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='value' />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title='Implementation Status Distribution'>
              <div className='h-64'>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={statusPie}
                      nameKey='name'
                      dataKey='value'
                      outerRadius={100}
                    >
                      {statusPie.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
