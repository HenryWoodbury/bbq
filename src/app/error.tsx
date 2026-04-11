"use client"

export default function GlobalError({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <button
        onClick={reset}
        className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Try again
      </button>
    </div>
  )
}
