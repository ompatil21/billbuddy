// src/app/(app)/layout.tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-dvh bg-gray-50">
            {/* navbar / sidebar could go here */}
            <main className="mx-auto max-w-6xl p-4">{children}</main>
        </div>
    );
}
