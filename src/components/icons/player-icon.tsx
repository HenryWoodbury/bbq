import type { IconProps } from "./types"

export function PlayerIcon({
  size = 24,
  strokeWidth = 1.6,
  className,
  ...props
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M3.855 16.186c-1.479 1.506-2.484 1.84-2.798 1.506-.313-.335 1.21-2.272 4.22-1.931 3.011.34 4.825 3.146 7.557 3.146q2.733 0 5.995-3.445 3.285.792 3.487.724c.148-.05 1.869-4.735-.7-8.2-2.927-3.95-7.662-3.661-8.926-3.333-2.74.71-5.347 2.452-5.777 4.041q-.384 1.42-1.243 4.642L1.6 16.719" />
      <path d="M5.67 13.336q1.63-.141 2.89 0c.765.085 3.393.524 5.514 1.028q2.12.503 4.755 1.098" />
    </svg>
  )
}
