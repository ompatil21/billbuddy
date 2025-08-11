#!/bin/bash
# === Splitwise-ML frontend folder structure (src/app) ===

# Create directories
mkdir -p "src/app/(marketing)" \
         "src/app/(app)/dashboard" \
         "src/app/(app)/groups/[id]" \
         src/app/api/auth/[...nextauth] \
         src/app/api/ocr \
         src/app/api/groups/[id] \
         src/app/api/expenses \
         src/components/common \
         src/components/forms \
         src/components/groups \
         src/components/expenses \
         src/components/ui \
         src/features/auth \
         src/features/groups \
         src/features/expenses \
         src/hooks \
         src/lib \
         src/styles \
         public

# Placeholder routes
cat > "src/app/(marketing)/page.tsx" << 'EOF'
export default function Marketing(){
  return (
    <section className="py-16">
      <h1 className="text-4xl font-bold">Split, Scan, Settle.</h1>
      <p className="mt-2 text-gray-600">A Splitwise-style app with OCR and smart extras.</p>
      <a className="mt-6 inline-block rounded bg-black px-4 py-2 text-white" href="/api/auth/signin">Get started</a>
    </section>
  );
}
EOF

cat > "src/app/(app)/layout.tsx" << 'EOF'
export default function AppLayout({ children }: { children: React.ReactNode }){
  return <div className="py-4">{children}</div>
}
EOF

cat > "src/app/(app)/dashboard/page.tsx" << 'EOF'
export default function Dashboard(){
  return <div className="py-6">Dashboard — signed-in area.</div>
}
EOF

cat > "src/app/(app)/groups/page.tsx" << 'EOF'
export default function GroupsPage(){
  return <div className="py-6">Your groups will appear here.</div>
}
EOF

cat > "src/app/(app)/groups/[id]/page.tsx" << 'EOF'
export default function GroupDetail(){
  return <div className="py-6">Group detail</div>
}
EOF

# Minimal lib helpers
cat > src/lib/fetch.ts << 'EOF'
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers||{}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}
EOF

cat > src/lib/currency.ts << 'EOF'
export const toCents = (n: number) => Math.round(n * 100);
export const fromCents = (c: number) => (c / 100).toFixed(2);
export const formatMoney = (cents: number, currency = 'AUD') => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents/100);
EOF

cat > src/lib/types.ts << 'EOF'
export type ID = string;
export type User = { id: ID; name: string; email: string; image?: string };
export type Group = { id: ID; name: string; currency: string; memberIds: ID[] };
export type ExpenseItem = { name: string; qty: number; cents: number };
EOF

# Components placeholders
cat > src/components/common/EmptyState.tsx << 'EOF'
export default function EmptyState({ title = 'Nothing here yet', subtitle }: { title?: string; subtitle?: string; }){
  return (
    <div className="rounded-lg border p-8 text-center text-gray-600">
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="mt-1 text-sm">{subtitle}</p>}
    </div>
  );
}
EOF

cat > src/components/expenses/ReceiptUpload.tsx << 'EOF'
'use client';
import { useState } from 'react';
export default function ReceiptUpload(){
  const [msg, setMsg] = useState('');
  return (
    <div className="rounded-xl border p-4">
      <div className="mb-2 text-sm font-medium">Receipt upload (placeholder)</div>
      <input type="file" onChange={()=>setMsg('File selected. OCR coming soon…')} />
      {msg && <p className="mt-2 text-sm text-gray-500">{msg}</p>}
    </div>
  );
}
EOF

# Global styles
cat > src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

echo "✅ Folder structure and placeholder files created under src/"
