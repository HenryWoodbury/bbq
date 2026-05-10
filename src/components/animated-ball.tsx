"use client"

import { useState } from "react"
import { SpinningStitchBall } from "@/components/spinning-stitch-ball"

type AnimatedBallProps = {
  size?: number
  className?: string
}

export function AnimatedBall({ size = 160, className }: AnimatedBallProps) {
  const [paused, setPaused] = useState(false)

  return (
    <button
      type="button"
      aria-label={paused ? "Resume ball animation" : "Pause ball animation"}
      aria-pressed={paused}
      onClick={() => setPaused((p) => !p)}
      className="cursor-default bg-transparent border-0 p-0"
    >
      <SpinningStitchBall
        size={size}
        paused={paused}
        className={className}
      />
    </button>
  )
}
