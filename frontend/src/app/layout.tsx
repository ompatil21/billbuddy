// app/layout.tsx
import "./globals.css";
import SessionProvider from "@/components/SessionProvider"; // this file has "use client"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
