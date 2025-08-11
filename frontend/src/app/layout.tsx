import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Splitwise‑ML',
  description: 'Splitwise-style app with OCR and smart extras',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="mx-auto max-w-6xl px-4">{children}</div>
      </body>
    </html>
  );
}
