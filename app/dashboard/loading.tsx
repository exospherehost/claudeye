/** Skeleton loading UI for the dashboard page. */
export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <div className="mb-6">
          <div className="h-8 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted/50 rounded animate-pulse mt-2" />
        </div>

        {/* Filter tiles skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4">
              <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
              <div className="h-8 bg-muted/50 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="h-4 w-48 bg-muted rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
