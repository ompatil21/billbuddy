'use client';

import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import Tabs from '@/components/common/Tabs';
import ExpenseQuickAdd from '@/features/expenses/ExpenseQuickAdd';
import { useGroups } from '@/features/groups/useGroups';
import { useExpenses } from '@/features/expenses/useExpenses';
import { formatMoney } from '@/lib/currency';

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { groups } = useGroups();
  const group = groups.find(g => g.id === id);
  const { expenses, add } = useExpenses(id!);

  if (!group) {
    return (
      <div className="py-6">
        <PageHeader title="Group not found" />
        <button className="mt-2 rounded-md border px-3 py-1.5 text-sm" onClick={() => router.push('/groups')}>
          ← Back to groups
        </button>
      </div>
    );
  }

  const ExpensesTab = (
    <div>
      <ExpenseQuickAdd currency={group.currency} onAdd={add} />
      {expenses.length === 0 ? (
        <p className="text-sm text-gray-600">No expenses yet. Add one above.</p>
      ) : (
        <ul className="divide-y">
          {expenses.map(e => (
            <li key={e.id} className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">{e.description}</div>
                <div className="text-xs text-gray-500">{new Date(e.dateISO).toLocaleString()}</div>
              </div>
              <div className="text-sm">{formatMoney(e.amount_cents, e.currency)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const BalancesTab = (
    <div className="text-sm text-gray-600">Balances view coming soon…</div>
  );

  const DashboardTab = (
    <div className="text-sm text-gray-600">Charts & trends coming soon…</div>
  );

  return (
    <>
      <PageHeader title={group.name} subtitle={`${group.currency} • ${group.memberCount} member${group.memberCount !== 1 ? 's' : ''}`} />
      <Tabs tabs={[
        { label: 'Expenses', content: ExpensesTab },
        { label: 'Balances', content: BalancesTab },
        { label: 'Dashboard', content: DashboardTab },
      ]} />
    </>
  );
}
