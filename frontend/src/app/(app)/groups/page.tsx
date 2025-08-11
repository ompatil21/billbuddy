import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import Link from 'next/link';

export default function GroupsPage() {
  return (
    <>
      <PageHeader title="Groups" subtitle="Trips, flats, or projects—organise expenses by group." />
      <div className="mb-4">
        <Link href="/groups/create" className="rounded-md bg-black px-3 py-2 text-sm text-white">+ New Group</Link>
      </div>
      <EmptyState subtitle="You don’t have any groups yet." />
    </>
  );
}
