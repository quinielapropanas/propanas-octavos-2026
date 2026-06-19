// Global loading state for (participant) and (admin) route groups

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-pp-bg-surface rounded-lg" />
      <div className="h-32 bg-pp-bg-card rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 bg-pp-bg-card rounded-lg" />
        <div className="h-24 bg-pp-bg-card rounded-lg" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-pp-bg-card rounded-lg" />)}
      </div>
    </div>
  );
}

