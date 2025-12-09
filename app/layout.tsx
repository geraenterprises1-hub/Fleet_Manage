import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GERA ENTERPRISES - Fleet Management System',
  description: 'Gera Enterprises Fleet Management System - Uber Fleet Driver Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

