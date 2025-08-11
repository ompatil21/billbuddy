'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/groups', label: 'Groups' },
];

export default function AppNav() {
    const pathname = usePathname();
    return (
        <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                <Link href="/dashboard" className="text-lg font-semibold">Splitwise‑ML</Link>
                <nav className="flex items-center gap-1">
                    {tabs.map(t => {
                        const active = pathname?.startsWith(t.href);
                        return (
                            <Link
                                key={t.href}
                                href={t.href}
                                className={`rounded-md px-3 py-1.5 text-sm ${active ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                                {t.label}
                            </Link>
                        );
                    })}
                </nav>
                {/* Right side actions (later: user avatar, sign out) */}
                <div className="text-sm text-gray-500">demo</div>
            </div>
        </header>
    );
}
