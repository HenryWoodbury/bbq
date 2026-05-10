import { cn } from "@/lib/utils"
import type { IconProps } from "./types"

const SIZES = { xs: 12, sm: 14, md: 16, lg: 20 } as const

export function ParkIcon({
  size = "md",
  strokeWidth = 2,
  className,
  ...props
}: IconProps) {
  const px = SIZES[size]
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      <g id="Group-3" transform="translate(1.033718, 1.000000)">
        <path
          d="M10,20 C5,20 0,8.42584873 0,7.43319838 C0,6.44054803 2.95310088,0 10,0 C17.0468991,0 20,6.36195134 20,7.43319838 C20,8.50444542 15,20 10,20 Z"
          id="Path-10"
        ></path>
        <rect
          id="Rectangle"
          transform="translate(9.966282, 12.000000) rotate(45.000000) translate(-9.966282, -12.000000) "
          x="6.96628206"
          y="9"
          width="6"
          height="6"
        ></rect>
      </g>
    </svg>
  )
}
