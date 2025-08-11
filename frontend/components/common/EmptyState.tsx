export default function EmptyState({ title = 'Nothing here yet', subtitle }: { title?: string; subtitle?: string; }){
  return (
    <div className="rounded-lg border p-8 text-center text-gray-600">
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="mt-1 text-sm">{subtitle}</p>}
    </div>
  );
}
