function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-slate-800 ${className}`} />;
}

function SkeletonCardGrid({ cards = 3 }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }, (_, index) => (
        <div
          key={index}
          className="rounded-lg border border-slate-800 bg-slate-900 p-6"
        >
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="mt-4 h-8 w-40" />
          <SkeletonBlock className="mt-6 h-4 w-full" />
          <SkeletonBlock className="mt-3 h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function SkeletonTable({ rows = 5, columns = 5 }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }, (_, columnIndex) => (
              <SkeletonBlock key={columnIndex} className="h-10" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export { SkeletonBlock, SkeletonCardGrid, SkeletonTable };
