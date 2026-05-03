"use client"

import React, { type HTMLAttributes, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type SpinAxis = "pitch" | "yaw" | "roll"

type SpinningBallProps = {
  size?: number
  yaw?: number
  pitch?: number
  roll?: number
  spinRpm?: number
  spinAxis?: SpinAxis
  direction?: "ltr" | "rtl"
  speed?: number
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, "className">

const SEAM_A = 0.42
const SEAM_NZ_FACTOR = 2 * Math.sqrt(SEAM_A - SEAM_A * SEAM_A)
const NUM_PTS = 150
const BASE_TRAVEL_DURATION = 18

function computeSeamPolylines(
  cx: number,
  cy: number,
  radius: number,
  yawRad: number,
  pitchRad: number,
  rollRad: number,
): string[] {
  const cosPitch = Math.cos(pitchRad)
  const sinPitch = Math.sin(pitchRad)
  const cosYaw = Math.cos(yawRad)
  const sinYaw = Math.sin(yawRad)
  const cosRoll = Math.cos(rollRad)
  const sinRoll = Math.sin(rollRad)

  const polylines: string[] = []
  let segment: string[] = []

  for (let i = 0; i <= NUM_PTS; i++) {
    const t = (i / NUM_PTS) * 4 * Math.PI

    const nx = Math.cos(t) + SEAM_A * Math.cos(3 * t)
    const ny = Math.sin(t) - SEAM_A * Math.sin(3 * t)
    const nz = SEAM_NZ_FACTOR * Math.sin(2 * t)
    const mag = Math.sqrt(nx * nx + ny * ny + nz * nz)

    const ux = nx / mag
    const uy = ny / mag
    const uz = nz / mag

    const y1 = uy * cosPitch - uz * sinPitch
    const z1 = uy * sinPitch + uz * cosPitch
    const x2 = ux * cosYaw + z1 * sinYaw
    const z2 = -ux * sinYaw + z1 * cosYaw
    const x3 = x2 * cosRoll - y1 * sinRoll
    const y3 = x2 * sinRoll + y1 * cosRoll

    if (z2 > 0) {
      segment.push(`${(cx + x3 * radius).toFixed(2)},${(cy - y3 * radius).toFixed(2)}`)
    } else {
      if (segment.length > 1) polylines.push(segment.join(" "))
      segment = []
    }
  }
  if (segment.length > 1) polylines.push(segment.join(" "))

  return polylines
}

export function SpinningBall({
  size = 160,
  yaw = 0,
  pitch = 0,
  roll = 0,
  spinRpm = 10,
  spinAxis = "yaw",
  direction,
  speed = 1,
  className,
  onClick,
  ...handlers
}: SpinningBallProps) {
  const r = size / 2
  const seamRadius = r * 0.97

  const [clickPaused, setClickPaused] = useState(false)
  const clickPausedRef = useRef(false)
  const rafRef = useRef<number>(0)
  const lastTsRef = useRef<number | null>(null)
  const visibilityPausedRef = useRef(false)
  const startRef = useRef<(() => void) | null>(null)

  const [polylines, setPolylines] = useState<string[]>(() =>
    computeSeamPolylines(
      r,
      r,
      seamRadius,
      yaw * (Math.PI / 180),
      pitch * (Math.PI / 180),
      roll * (Math.PI / 180),
    ),
  )

  useEffect(() => {
    const state = {
      yaw: yaw * (Math.PI / 180),
      pitch: pitch * (Math.PI / 180),
      roll: roll * (Math.PI / 180),
    }

    function start() {
      lastTsRef.current = null
      rafRef.current = requestAnimationFrame(tick)
    }

    function tick(ts: number) {
      if (visibilityPausedRef.current || clickPausedRef.current) return

      const dt = lastTsRef.current !== null ? (ts - lastTsRef.current) / 1000 : 0
      lastTsRef.current = ts

      const delta = spinRpm * 6 * (Math.PI / 180) * dt
      state[spinAxis] += delta

      if (delta !== 0) {
        setPolylines(
          computeSeamPolylines(r, r, seamRadius, state.yaw, state.pitch, state.roll),
        )
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    function onVisibilityChange() {
      visibilityPausedRef.current = document.hidden
      if (!visibilityPausedRef.current && !clickPausedRef.current) {
        cancelAnimationFrame(rafRef.current)
        start()
      }
    }

    startRef.current = start
    document.addEventListener("visibilitychange", onVisibilityChange)
    start()

    return () => {
      cancelAnimationFrame(rafRef.current)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const strokeWidth = Math.max(2, size / 50)

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const nowPaused = !clickPausedRef.current
    clickPausedRef.current = nowPaused
    setClickPaused(nowPaused)
    if (nowPaused) {
      cancelAnimationFrame(rafRef.current)
    } else if (!visibilityPausedRef.current) {
      startRef.current?.()
    }
    onClick?.(e)
  }

  const traveling = speed > 0 && direction !== undefined
  const travelStyle = traveling
    ? ({
        "--ball-travel-duration": `${BASE_TRAVEL_DURATION / speed}s`,
        animationPlayState: clickPaused ? "paused" : "running",
      } as React.CSSProperties)
    : undefined

  return (
    <div
      aria-hidden="true"
      className={cn(traveling && `ball-travel-${direction}`, className)}
      style={travelStyle}
      onClick={handleClick}
      {...handlers}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx={r}
          cy={r}
          r={seamRadius}
          fill="var(--ball-fill)"
          stroke="var(--ball-stroke)"
          strokeWidth={strokeWidth * 0.4}
        />
        {polylines.map((pts, i) => (
          <polyline
            key={i}
            points={pts}
            fill="none"
            stroke="var(--ball-seam)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>
  )
}
