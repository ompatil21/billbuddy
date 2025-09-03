// src/app/(app)/layout.tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="pastel-page min-h-dvh">
            <main className="mx-auto max-w-6xl p-4">{children}</main>
        </div>
    );
}
