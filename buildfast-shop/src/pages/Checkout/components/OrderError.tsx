/**
 * OrderError Component
 *
 * Displays error messages during checkout.
 */

interface OrderErrorProps {
  error: string
}

export function OrderError({ error }: OrderErrorProps) {
  if (!error) return null

  return (
    <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm font-medium text-red-800">{error}</p>
      </div>
    </div>
  )
}
