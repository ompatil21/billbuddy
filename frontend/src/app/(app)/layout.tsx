'use client';

import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import CreateGroupForm from '@/features/groups/CreateGroupForm';
import GroupCard from '@/features/groups/GroupCard';
import { useGroups } from '@/features/groups/useGroups';
import { useState } from 'react';

export default function GroupsPage() {
  const { groups, createGroup, removeGroup } = useGroups();
  const [showForm, setShowForm] = useState(groups.length === 0);

  return (
    <>
      <PageHeader title="Groups" subtitle="Trips, flats, or projects—organise expenses by group." />
      <div className="mb-4 flex items-center gap-2">
        <button
          className="rounded-md bg-black px-3 py-2 text-sm text-white"
          onClick={() => setShowForm(v => !v)}
        >
          {showForm ? 'Close' : '+ New Group'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <CreateGroupForm
            onCreate={(g) => {
              const created = createGroup(g);
              setShowForm(false);
              // TODO: route to `/groups/${created.id}` once detail page uses params
            }}
            autoFocus
          />
        </div>
      )}

      {groups.length === 0 ? (
        <EmptyState subtitle="You don’t have any groups yet. Create your first group above." />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {groups.map(g => (
            <GroupCard key={g.id} g={g} onDelete={removeGroup} />
          ))}
        </div>
      )}
    </>
  );
}
