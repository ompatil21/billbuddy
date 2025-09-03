// app/layout.tsx
import "./globals.css";
import SessionProvider from "@/components/SessionProvider"; // this file has "use client"
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}
          <Toaster position="top-right" closeButton richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
