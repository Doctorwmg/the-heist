import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'THE HEIST — Learn AI the Hard Way',
  description: 'Master Python, SQL, Bash, vector databases, fine-tuning, and security through tactical coding missions in sandboxed environments.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        {/* Mobile gate — game requires desktop */}
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a] p-8 text-center lg:hidden">
          <h1 className="font-display text-3xl tracking-wider text-[#d4a843]">THE HEIST</h1>
          <p className="mt-2 text-xs uppercase tracking-widest text-[#888888]">by New World Coding</p>
          <div className="mt-8 max-w-sm">
            <p className="text-[#f0f0f0]">
              THE HEIST requires a desktop browser.
            </p>
            <p className="mt-2 text-sm text-[#888888]">
              Minimum 1024px screen width for the mission interface.
            </p>
          </div>
        </div>
        {/* Main content — hidden on mobile, visible on lg+ */}
        <div className="hidden lg:block">
          {children}
        </div>
      </body>
    </html>
  );
}
