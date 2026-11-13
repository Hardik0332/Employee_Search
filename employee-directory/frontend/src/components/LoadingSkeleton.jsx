/**
 * LoadingSkeleton — shimmering placeholder cards.
 *
 * Matches the exact layout of EmployeeCard so the page
 * doesn't jump when real data replaces the skeletons.
 */

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm
                 dark:border-gray-700/60 dark:bg-gray-800"
    >
      {/* Top row: circle + two lines */}
      <div className="flex items-start gap-4">
        <div className="skeleton h-12 w-12 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      </div>

      {/* Details row: one line + badge */}
      <div className="mt-3 space-y-2.5 pl-16">
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="flex gap-2">
          <div className="skeleton h-5 w-20 rounded-full" />
          <div className="skeleton h-3 w-28 rounded" />
        </div>
      </div>
    </div>
  );
}

export function LoadingSkeleton({ count = 6 }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

