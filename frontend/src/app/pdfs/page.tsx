// frontend/src/app/pdfs/page.tsx
import { axiosClient } from '@/lib/api';
import Link from 'next/link';

type UploadItem = {
  id: string;
  originalName: string;
  slug: string;
  storedName: string;
  path: string;
  size: string;
  mimetype: string;
  createdAt: string;
};

type ApiResponse = {
  items: UploadItem[];
  page: number;
  limit: number;
  total: number;
};

function formatBytes(bytesStr: string) {
  const bytes = Number.parseInt(bytesStr, 10) || 0;
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function getUploads(page: number, limit: number): Promise<ApiResponse> {
  const res = await axiosClient.get<ApiResponse>('/upload', {
    params: { page, limit },
  });
  return res.data;
}

function PageLink({
  page,
  limit,
  children,
  disabled,
  ariaLabel,
}: {
  page: number;
  limit: number;
  children: React.ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const className =
    'px-3 py-1.5 rounded-lg border text-sm font-medium ' +
    (disabled
      ? 'opacity-40 pointer-events-none'
      : 'bg-background hover:bg-muted transition');
  return (
    <Link
      href={{ pathname: '/pdfs', query: { page, limit } }}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}

function FileTypeBadge({ type }: { type: string }) {
  const isPdf = type.toLowerCase().includes('pdf');
  const base =
    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium';
  return (
    <span
      className={
        base +
        ' ' +
        (isPdf
          ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300 border border-red-200/60'
          : 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border border-blue-200/60')
      }
      title={type}
    >
      <svg width='12' height='12' viewBox='0 0 24 24' className='shrink-0'>
        <path
          d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'
          fill='currentColor'
          opacity='.2'
        />
        <path
          d='M14 2v6h6'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
      {isPdf ? 'PDF' : (type.split('/')[1]?.toUpperCase() ?? 'FILE')}
    </span>
  );
}

function LimitButton({
  value,
  page,
  current,
}: {
  value: number;
  page: number;
  current: number;
}) {
  const active = 'bg-primary text-primary-foreground border-primary shadow-sm';
  const base =
    'px-2.5 py-1 rounded-md border text-xs font-medium hover:bg-muted transition';
  return (
    <Link
      href={{ pathname: '/pdfs', query: { page, limit: value } }}
      className={current === value ? `${base} ${active}` : base}
      aria-label={`Show ${value} per page`}
    >
      {value}
    </Link>
  );
}

export default async function PdfListPage({
  searchParams,
}: {
  searchParams?: { page?: string; limit?: string };
}) {
  const page = Math.max(1, Number(searchParams?.page ?? 1));
  const limit = Math.max(1, Number(searchParams?.limit ?? 20));

  const { items, total } = await getUploads(page, limit);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const windowSize = 5;
  const start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className='mx-auto max-w-6xl p-6 space-y-6'>
      {/* Hero / Header */}
      <div className='overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 md:p-8'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>
              Uploaded PDFs
            </h1>
            <p className='text-sm text-muted-foreground mt-1'>
              Manage your extracted documents and jump into details fast.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Link
              href='/'
              className='rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted transition'
            >
              ← Home
            </Link>
          </div>
        </div>
        <div className='mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
          <span className='inline-flex items-center gap-1 rounded-md border px-2 py-1'>
            Total: <strong className='font-semibold'>{total}</strong>
          </span>
          <span className='inline-flex items-center gap-1 rounded-md border px-2 py-1'>
            Page: <strong className='font-semibold'>{page}</strong> /{' '}
            {totalPages}
          </span>
          <div className='ml-auto flex items-center gap-1'>
            <span className='mr-1'>Per page:</span>
            {[10, 20, 50].map((n) => (
              <LimitButton key={n} value={n} page={1} current={limit} />
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className='rounded-2xl border bg-card'>
        {items.length === 0 && (
          <div className='p-10 text-center'>
            <div className='mx-auto mb-2 h-10 w-10 rounded-full bg-muted/60 grid place-items-center'>
              <span className='text-lg'>📄</span>
            </div>
            <p className='text-sm text-muted-foreground'>No PDFs found.</p>
          </div>
        )}

        <ul className='divide-y'>
          {items.map((it) => (
            <li
              key={it.id}
              className='group p-4 md:p-5 hover:bg-muted/40 transition'
            >
              <div className='flex items-center gap-4'>
                {/* Icon */}
                <div className='hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-background'>
                  <span className='text-xl'>📄</span>
                </div>

                {/* Main */}
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h2 className='truncate text-base font-semibold tracking-tight'>
                      {it.originalName}
                    </h2>
                    <FileTypeBadge type={it.mimetype} />
                  </div>

                  <div className='mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                    <span className='inline-flex items-center gap-1'>
                      <svg width='14' height='14' viewBox='0 0 24 24'>
                        <path
                          d='M4 6h16M4 12h16M4 18h16'
                          stroke='currentColor'
                          strokeWidth='1.5'
                          strokeLinecap='round'
                        />
                      </svg>
                      {it.mimetype} • {formatBytes(it.size)}
                    </span>
                    <span className='inline-flex items-center gap-1 whitespace-nowrap'>
                      <svg width='14' height='14' viewBox='0 0 24 24'>
                        <path
                          d='M12 8v5l3 3'
                          stroke='currentColor'
                          strokeWidth='1.5'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          fill='none'
                        />
                        <circle
                          cx='12'
                          cy='12'
                          r='9'
                          stroke='currentColor'
                          strokeWidth='1.5'
                          fill='none'
                        />
                      </svg>
                      Added {formatDate(it.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className='flex items-center gap-2'>
                  <Link
                    href={`/pdfs/${it.id}`}
                    className='rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 transition'
                  >
                    View
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination */}
      <div className='flex items-center justify-center gap-2 pt-2'>
        <PageLink
          page={1}
          limit={limit}
          disabled={page === 1}
          ariaLabel='First page'
        >
          « First
        </PageLink>
        <PageLink
          page={Math.max(1, page - 1)}
          limit={limit}
          disabled={page === 1}
          ariaLabel='Previous page'
        >
          ‹ Prev
        </PageLink>

        {start > 1 && (
          <span className='px-2 text-sm text-muted-foreground'>…</span>
        )}

        {pages.map((p) => (
          <Link
            key={p}
            href={{ pathname: '/pdfs', query: { page: p, limit } }}
            className={
              'px-3 py-1.5 rounded-lg border text-sm font-medium transition ' +
              (p === page
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-background hover:bg-muted')
            }
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Link>
        ))}

        {end < totalPages && (
          <span className='px-2 text-sm text-muted-foreground'>…</span>
        )}

        <PageLink
          page={Math.min(totalPages, page + 1)}
          limit={limit}
          disabled={page === totalPages}
          ariaLabel='Next page'
        >
          Next ›
        </PageLink>
        <PageLink
          page={totalPages}
          limit={limit}
          disabled={page === totalPages}
          ariaLabel='Last page'
        >
          Last »
        </PageLink>
      </div>
    </div>
  );
}
