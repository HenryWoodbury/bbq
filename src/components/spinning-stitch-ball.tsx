"use client"

import React, { type HTMLAttributes, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type SpinAxis = "pitch" | "yaw" | "roll"

type SpinningStitchBallProps = {
  size?: number
  yaw?: number
  pitch?: number
  roll?: number
  rpm?: number
  sloMoFactor?: number
  spinAxis?: SpinAxis
  direction?: "ltr" | "rtl"
  speed?: number
  paused?: boolean
  ballFill?: string
  ballStroke?: string
  ballSeam?: string
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, "className">

type StitchLine = { x1: number; y1: number; x2: number; y2: number; w: number }

const SEAM_A = 0.42
const SEAM_NZ_FACTOR = 2 * Math.sqrt(SEAM_A - SEAM_A * SEAM_A)
const INV_SQRT2 = 1 / Math.sqrt(2)

const STITCH_COUNT = 216
const STITCH_SPREAD = 0.2
const CHEVRON_OFFSET = 0.04
const THREAD_W_FRAC = 8 / 290
const THREAD_EDGE_FRAC = 4 / 290

const BASE_TRAVEL_DURATION = 18

function rotate3d(
  x: number,
  y: number,
  z: number,
  cosPitch: number,
  sinPitch: number,
  cosYaw: number,
  sinYaw: number,
  cosRoll: number,
  sinRoll: number,
): [number, number, number] {
  // Pre-rotation: 45° around Z so horseshoe seam faces viewer; x→right (1st base), z→up, y→depth (toward pitcher)
  const xp = (x + y) * INV_SQRT2
  const yp = z
  const zp = (-x + y) * INV_SQRT2
  const y1 = yp * cosPitch - zp * sinPitch
  const z1 = yp * sinPitch + zp * cosPitch
  const x2 = xp * cosYaw - z1 * sinYaw
  const z2 = xp * sinYaw + z1 * cosYaw
  const x3 = x2 * cosRoll - y1 * sinRoll
  const y3 = x2 * sinRoll + y1 * cosRoll
  return [x3, y3, z2]
}

function computeStitchLines(
  cx: number,
  cy: number,
  radius: number,
  yawRad: number,
  pitchRad: number,
  rollRad: number,
): StitchLine[] {
  const cosPitch = Math.cos(pitchRad)
  const sinPitch = Math.sin(pitchRad)
  const cosYaw = Math.cos(yawRad)
  const sinYaw = Math.sin(yawRad)
  const cosRoll = Math.cos(rollRad)
  const sinRoll = Math.sin(rollRad)

  const threadW = radius * THREAD_W_FRAC
  const threadEdge = radius * THREAD_EDGE_FRAC
  const lines: StitchLine[] = []

  for (let i = 0; i < STITCH_COUNT; i++) {
    const t = (i / STITCH_COUNT) * 4 * Math.PI

    // Normal (seam curve point, normalized)
    const nx0 = Math.cos(t) + SEAM_A * Math.cos(3 * t)
    const ny0 = Math.sin(t) - SEAM_A * Math.sin(3 * t)
    const nz0 = SEAM_NZ_FACTOR * Math.sin(2 * t)
    const nMag = Math.sqrt(nx0 * nx0 + ny0 * ny0 + nz0 * nz0)
    const nx = nx0 / nMag
    const ny = ny0 / nMag
    const nz = nz0 / nMag

    // Tangent (derivative of curve, normalized)
    const tx0 = -Math.sin(t) - 3 * SEAM_A * Math.sin(3 * t)
    const ty0 = Math.cos(t) - 3 * SEAM_A * Math.cos(3 * t)
    const tz0 = 2 * SEAM_NZ_FACTOR * Math.cos(2 * t)
    const tMag = Math.sqrt(tx0 * tx0 + ty0 * ty0 + tz0 * tz0)
    const tx = tx0 / tMag
    const ty = ty0 / tMag
    const tz = tz0 / tMag

    // Binormal (n × t, normalized)
    const bx0 = ny * tz - nz * ty
    const by0 = nz * tx - nx * tz
    const bz0 = nx * ty - ny * tx
    const bMag = Math.sqrt(bx0 * bx0 + by0 * by0 + bz0 * bz0)
    const bx = bx0 / bMag
    const by = by0 / bMag
    const bz = bz0 / bMag

    for (const side of [1, -1] as const) {
      // Puncture: offset perpendicularly from seam (binormal direction)
      const px = nx + side * bx * (STITCH_SPREAD / 2)
      const py = ny + side * by * (STITCH_SPREAD / 2)
      const pz = nz + side * bz * (STITCH_SPREAD / 2)

      // Destination: lean along tangent toward seam center
      const dx = nx + tx * CHEVRON_OFFSET
      const dy = ny + ty * CHEVRON_OFFSET
      const dz = nz + tz * CHEVRON_OFFSET

      // cos θ: thread direction relative to viewer's line of sight
      const d3x = dx - px
      const d3y = dy - py
      const d3z = dz - pz
      const d3m = Math.sqrt(d3x * d3x + d3y * d3y + d3z * d3z)
      let cosTheta = 0
      if (d3m > 1e-10) {
        const [, , rzDir] = rotate3d(
          d3x / d3m,
          d3y / d3m,
          d3z / d3m,
          cosPitch,
          sinPitch,
          cosYaw,
          sinYaw,
          cosRoll,
          sinRoll,
        )
        cosTheta = Math.abs(rzDir)
      }

      // Project puncture onto unit sphere, rotate, cull back-facing
      const pMag = Math.sqrt(px * px + py * py + pz * pz)
      const [px3, py3, pz2] = rotate3d(
        px / pMag,
        py / pMag,
        pz / pMag,
        cosPitch,
        sinPitch,
        cosYaw,
        sinYaw,
        cosRoll,
        sinRoll,
      )
      if (pz2 <= 0) continue

      // Project destination onto unit sphere, rotate, cull back-facing
      const dMag = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const [dx3, dy3, dz2] = rotate3d(
        dx / dMag,
        dy / dMag,
        dz / dMag,
        cosPitch,
        sinPitch,
        cosYaw,
        sinYaw,
        cosRoll,
        sinRoll,
      )
      if (dz2 <= 0) continue

      // Variable width: tapers toward limb, reduced for face-on threads
      const rzAvg = (pz2 + dz2) / 2
      const dPos = Math.sqrt(Math.max(0, 1 - rzAvg * rzAvg))
      const effectiveD = dPos * (1 - cosTheta)
      const w =
        effectiveD <= 0.5
          ? threadW
          : threadW + (threadEdge - threadW) * ((effectiveD - 0.5) / 0.5)

      lines.push({
        x1: cx + px3 * radius,
        y1: cy - py3 * radius,
        x2: cx + dx3 * radius,
        y2: cy - dy3 * radius,
        w,
      })
    }
  }

  return lines
}

export function SpinningStitchBall({
  size = 160,
  yaw = 0,
  pitch = 0,
  roll = 0,
  rpm = 10,
  sloMoFactor = 1,
  spinAxis = "yaw",
  direction,
  speed = 1,
  paused = false,
  ballFill,
  ballStroke,
  ballSeam,
  className,
  ...props
}: SpinningStitchBallProps) {
  const r = size / 2
  const seamRadius = r * 0.97

  const pausedRef = useRef(paused)
  const rafRef = useRef<number>(0)
  const lastTsRef = useRef<number | null>(null)
  const visibilityPausedRef = useRef(false)
  const startRef = useRef<(() => void) | null>(null)
  const spinStateRef = useRef({
    yaw: yaw * (Math.PI / 180),
    pitch: pitch * (Math.PI / 180),
    roll: roll * (Math.PI / 180),
  })

  const [stitches, setStitches] = useState<StitchLine[]>(() =>
    computeStitchLines(
      r,
      r,
      seamRadius,
      yaw * (Math.PI / 180),
      pitch * (Math.PI / 180),
      roll * (Math.PI / 180),
    ),
  )

  useEffect(() => {
    spinStateRef.current.yaw = yaw * (Math.PI / 180)
    spinStateRef.current.pitch = pitch * (Math.PI / 180)
    spinStateRef.current.roll = roll * (Math.PI / 180)
  }, [yaw, pitch, roll])

  useEffect(() => {
    function start() {
      lastTsRef.current = null
      rafRef.current = requestAnimationFrame(tick)
    }

    function tick(ts: number) {
      if (visibilityPausedRef.current || pausedRef.current) return

      const dt =
        lastTsRef.current !== null ? (ts - lastTsRef.current) / 1000 : 0
      lastTsRef.current = ts

      const delta = (rpm / sloMoFactor) * 6 * (Math.PI / 180) * dt
      spinStateRef.current[spinAxis] += delta

      if (delta !== 0) {
        setStitches(
          computeStitchLines(
            r,
            r,
            seamRadius,
            spinStateRef.current.yaw,
            spinStateRef.current.pitch,
            spinStateRef.current.roll,
          ),
        )
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    function onVisibilityChange() {
      visibilityPausedRef.current = document.hidden
      if (!visibilityPausedRef.current && !pausedRef.current) {
        cancelAnimationFrame(rafRef.current)
        start()
      }
    }

    startRef.current = start
    document.addEventListener("visibilitychange", onVisibilityChange)
    if (!pausedRef.current) start()

    return () => {
      cancelAnimationFrame(rafRef.current)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [rpm, sloMoFactor, spinAxis, r, seamRadius])

  useEffect(() => {
    const prev = pausedRef.current
    pausedRef.current = paused
    if (!prev && paused) {
      cancelAnimationFrame(rafRef.current)
    } else if (prev && !paused && !visibilityPausedRef.current) {
      startRef.current?.()
    }
  }, [paused])

  const strokeWidth = Math.max(2, size / 50)

  const traveling = speed > 0 && direction !== undefined
  const style = {
    ...(traveling && {
      "--ball-travel-duration": `${BASE_TRAVEL_DURATION / speed}s`,
      animationPlayState: paused ? "paused" : "running",
    }),
    ...(ballFill !== undefined && { "--ball-fill": ballFill }),
    ...(ballStroke !== undefined && { "--ball-stroke": ballStroke }),
    ...(ballSeam !== undefined && { "--ball-seam": ballSeam }),
  } as React.CSSProperties

  return (
    <div
      aria-hidden="true"
      className={cn(traveling && `ball-travel-${direction}`, className)}
      style={style}
      {...props}
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
        {stitches.map((s, i) => (
          <line
            // biome-ignore lint/suspicious/noArrayIndexKey: stable computed array, no reordering
            key={i}
            x1={s.x1.toFixed(2)}
            y1={s.y1.toFixed(2)}
            x2={s.x2.toFixed(2)}
            y2={s.y2.toFixed(2)}
            stroke="var(--ball-seam)"
            strokeWidth={s.w.toFixed(2)}
            strokeLinecap="round"
          />
        ))}
      </svg>
    </div>
  )
}
