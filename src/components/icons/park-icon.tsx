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
          d="M10,19 C5,19 0,8.0045563 0,7.06153846 C0,6.11852063 2.95310088,0 10,0 C17.0468991,0 20,6.04385377 20,7.06153846 C20,8.07922315 15,19 10,19 Z"
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

/* 
        
      <g id="park" transform="translate(2.033718, 1.000000)">
        <path
          d="M10,16.9381975 L0,7.03586667 C1.96873392,2.34528889 5.30206725,0 10,0 C14.6979327,0 18.0312661,2.34528889 20,7.03586667 L10,16.9381975 Z"
          id="Path-10"
        ></path>
        <polyline
          id="Rectangle"
          transform="translate(10.000000, 14.071733) rotate(-45.000000) translate(-10.000000, -14.071733) "
          points="7.89473684 11.9664702 12.0847012 11.9870321 12.1052632 16.1769965"
        ></polyline>
        <path
          d="M7.0999064,10.5626623 C9.00083933,9.63822467 10.5755587,9.80025878 11.8240646,11.0487646 C13.0725704,12.2972705 13.2346045,13.8719899 12.3101669,15.7729228"
          id="Rectangle"
          transform="translate(10.000000, 12.872829) rotate(-45.000000) translate(-10.000000, -12.872829) "
        ></path>
      </g>
*/
