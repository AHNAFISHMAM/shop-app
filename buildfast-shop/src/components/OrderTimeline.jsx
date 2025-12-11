import { useState, useEffect } from 'react';
import PropTypes from 'prop-types'

/**
 * OrderTimeline Component
 * Visual progress tracker showing order status journey
 * Simple and clean design - mobile responsive
 */

function OrderTimeline({ status }) {
  // Theme detection
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'));
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);
  // Define the order stages in sequence
  const stages = [
    { id: 'pending', label: 'Order Placed', icon: '📝' },
    { id: 'processing', label: 'Processing', icon: '⚙️' },
    { id: 'shipped', label: 'Shipped', icon: '🚚' },
    { id: 'delivered', label: 'Delivered', icon: '✅' }
  ]

  // Find current stage index
  const currentIndex = stages.findIndex(s => s.id === status)
  const isCancelled = status === 'cancelled'
  const isFailed = status === 'failed'

  // If order is cancelled or failed, show special state
  if (isCancelled || isFailed) {
    return (
      <div 
        className="border rounded-lg p-4"
        style={{
          backgroundColor: isLightTheme 
            ? 'rgba(239, 68, 68, 0.1)' 
            : 'rgba(220, 38, 38, 0.2)',
          borderColor: isLightTheme 
            ? 'rgba(239, 68, 68, 0.3)' 
            : 'rgba(220, 38, 38, 0.4)'
        }}
      >
        <div 
          className="flex items-center justify-center gap-2"
          style={{
            color: isLightTheme 
              ? 'rgb(185, 28, 28)' 
              : 'rgb(254, 202, 202)'
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="font-semibold">
            {isCancelled ? 'Order Cancelled' : 'Order Failed'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="rounded-lg p-4 border border-theme"
      style={{
        backgroundColor: isLightTheme 
          ? 'rgba(255, 255, 255, 0.95)' 
          : 'rgba(5, 5, 9, 0.95)'
      }}
    >
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex

          return (
            <div key={stage.id} className="flex items-center flex-1">
              {/* Stage Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl border-2 transition-all ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-black'
                      : isCurrent
                      ? 'bg-blue-600 border-blue-600 text-black animate-pulse'
                      : 'bg-theme-elevated border-theme text-[var(--text-muted)]'
                  }`}
                >
                  {stage.icon}
                </div>
                {/* Stage Label */}
                <p
                  className={`mt-2 text-xs sm:text-sm font-medium text-center ${
                    isCompleted || isCurrent ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {stage.label}
                </p>
                {/* Current stage indicator */}
                {isCurrent && (
                  <span className="mt-1 text-xs text-blue-600 font-semibold">Current</span>
                )}
              </div>

              {/* Connecting Line (except after last stage) */}
              {index < stages.length - 1 && (
                <div className="flex-1 h-0.5 mx-2">
                  <div
                    className="h-full"
                    style={{
                      backgroundColor: index < currentIndex 
                        ? '#10b981' 
                        : (isLightTheme ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)')
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Status Message */}
      <div className="mt-4 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          {currentIndex === 0 && 'Your order has been received and is being prepared'}
          {currentIndex === 1 && 'Your order is being processed and will ship soon'}
          {currentIndex === 2 && 'Your order is on its way'}
          {currentIndex === 3 && 'Your order has been delivered successfully'}
          {currentIndex === -1 && 'Order status: ' + status}
        </p>
      </div>
    </div>
  )
}

export default OrderTimeline

OrderTimeline.propTypes = {
  status: PropTypes.string.isRequired
}
