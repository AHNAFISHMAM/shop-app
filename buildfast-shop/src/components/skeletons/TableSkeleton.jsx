/**
 * Table Skeleton
 * Loading placeholder for data tables
 * @param {number} rows - Number of rows to display
 * @param {number} cols - Number of columns to display
 */
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <div 
              key={j} 
              className="h-12 bg-[var(--bg-elevated)] rounded flex-1"
              style={{ 
                animationDelay: `${(i * cols + j) * 50}ms` 
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

