import React from 'react'

export function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error
  resetErrorBoundary: () => void
}) {
  return (
    <div
      role='alert'
      style={{
        padding: '20px',
      }}
    >
      <p
        style={{
          color: 'red',
        }}
      >
        Something went wrong:
      </p>
      <p
        style={{
          color: 'red',
        }}
      >
        {error.message}
      </p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}
