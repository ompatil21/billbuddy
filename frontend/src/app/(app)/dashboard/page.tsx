import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';

export default function Dashboard() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Quick overview of your groups and recent expenses." />
      <EmptyState title="No data yet" subtitle="Create a group to get started." />
    </>
  );
}
