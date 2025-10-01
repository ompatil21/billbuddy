export default function Loading() {
    return (
        <div className="animate-pulse">
            <div className="h-6 w-40 rounded-md bg-pastel-ink/10 mb-2" />
            <div className="h-4 w-72 rounded-md bg-pastel-ink/10 mb-6" />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="h-9 w-32 rounded-xl bg-pastel-ink/10" />
                <div className="h-9 w-64 rounded-xl bg-pastel-ink/10" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="crayon-card rounded-2xl p-4 bg-pastel-ink/5 h-28"
                    />
                ))}
            </div>
        </div>
    );
}
