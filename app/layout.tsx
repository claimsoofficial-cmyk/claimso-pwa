// file: app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner'; // Correct import path after shadcn add
import '../styles/globals.css'; // Correct path to our global styles

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CLAIMSO',
  description: 'Your Smart Vault for Everything You Buy.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50`}>
        {/* The children here will be your other layouts and pages */}
        {children}
        
        {/* The Toaster is placed here to be available globally on all pages */}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}