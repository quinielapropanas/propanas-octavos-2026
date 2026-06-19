export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-pp-bg-surface rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-pp-bg-card rounded-lg" />)}
      </div>
      <div className="h-16 bg-pp-bg-card rounded-lg" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-pp-bg-card rounded-lg" />)}
      </div>
    </div>
  );
}

