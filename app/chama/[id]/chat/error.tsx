"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Chat error:', error)
  }, [error])

  return (
    <div className="container py-10 text-center">
      <h2 className="text-2xl font-bold mb-4">Chat Error</h2>
      <p className="text-muted-foreground mb-6">
        {error.message || 'Failed to load chat'}
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
        <button
          onClick={() => router.push('/chama-hub')}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Return to Chama Hub
        </button>
      </div>
    </div>
  )
}