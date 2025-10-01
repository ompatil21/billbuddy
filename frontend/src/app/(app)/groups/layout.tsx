// src/app/(app)/groups/layout.tsx

// Keep this as a Server Component (no "use client")
export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // IMPORTANT: must render {children} so /groups and /groups/[id] can display
  // We don't add padding/wrappers here to avoid duplicating the page's own layout.
  return <>{children}</>;
}
