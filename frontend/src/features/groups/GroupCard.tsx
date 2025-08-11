import Link from 'next/link';
import { GroupLite } from '@/features/groups/useGroups';

export default function GroupCard({ g, onDelete }: { g: GroupLite; onDelete?: (id: string) => void }) {
    return (
        <div className="flex items-center justify-between rounded-lg border bg-white p-4">
            <div>
                <div className="text-sm text-gray-500">{g.currency}</div>
                <div className="text-lg font-medium">{g.name}</div>
                <div className="text-xs text-gray-500">
                    {g.memberCount} member{g.memberCount !== 1 ? 's' : ''} • {new Date(g.createdAt).toLocaleDateString()}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Link href={`/groups/${g.id}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
                    Open
                </Link>
                {onDelete && (
                    <button
                        onClick={() => onDelete(g.id)}
                        className="rounded-md border px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
}
