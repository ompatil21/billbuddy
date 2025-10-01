"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GroupLite } from "@/features/groups/useGroups";

export default function GroupCard({
    g,
    onDelete,
}: {
    g: GroupLite;
    onDelete?: (id: string) => void;
}) {
    const router = useRouter();
    const href = `/groups/${g.id}`;

    return (
        <div className="flex items-center justify-between rounded-lg border bg-white p-4 relative">
            <div>
                <div className="text-sm text-gray-500">{g.currency}</div>
                <div className="text-lg font-medium">{g.name}</div>
                <div className="text-xs text-gray-500">
                    {g.memberCount} member{g.memberCount !== 1 ? "s" : ""} •{" "}
                    {new Date(g.createdAt).toLocaleDateString()}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* z-10 to be above any decorative overlays; onClick fallback to router */}
                <Link
                    href={href}
                    prefetch={false}
                    className="z-10 rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                    aria-label={`Open ${g.name}`}
                    onClick={(e) => {
                        // If some parent prevents default, do a hard fallback
                        // Give Next a tick; if URL didn’t change, push manually.
                        setTimeout(() => {
                            if (window.location.pathname !== href) router.push(href);
                        }, 0);
                    }}
                >
                    Open
                </Link>

                {onDelete && (
                    <button
                        onClick={() => onDelete(g.id)}
                        className="z-10 rounded-md border px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                        aria-label={`Delete ${g.name}`}
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
}
