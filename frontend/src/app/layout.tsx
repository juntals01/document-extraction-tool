import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { Toaster } from 'sonner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Document Extraction Tool',
  description: 'AI-powered PDF extraction system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <div className='min-h-screen flex flex-col'>
          {/* Header */}
          <header className='border-b bg-card/40 backdrop-blur-sm'>
            <div className='max-w-7xl mx-auto flex items-center justify-between px-6 py-4'>
              <Link href='/' className='text-lg font-semibold'>
                Document Extraction Tool
              </Link>
              <nav className='flex items-center gap-6 text-sm'>
                <Link
                  href='/'
                  className='text-muted-foreground hover:text-foreground transition-colors'
                >
                  Home
                </Link>
                <Link
                  href='/pdfs'
                  className='text-muted-foreground hover:text-foreground transition-colors'
                >
                  Uploaded PDFs
                </Link>
              </nav>
            </div>
          </header>

          {/* Main content */}
          <main className='flex-1'>{children}</main>

          {/* Footer */}
          <footer className='border-t bg-muted/30 mt-8'>
            <div className='max-w-7xl mx-auto px-6 py-8 text-sm text-muted-foreground'>
              <p className='font-medium'>
                Document Extraction Tool – Technical Assessment
              </p>
              <p className='mt-1'>
                This project demonstrates intelligent PDF parsing and AI-driven
                data extraction from unstructured agricultural and environmental
                reports.
              </p>
              <p className='mt-3 text-xs text-muted-foreground/80'>
                © {new Date().getFullYear()} Document Extraction Tool. All
                rights reserved.
              </p>
            </div>
          </footer>
        </div>

        <Toaster richColors position='top-right' />
      </body>
    </html>
  );
}
