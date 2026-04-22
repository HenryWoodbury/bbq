import type { SVGProps } from "react"

export type IconSize = "xs" | "sm" | "md" | "lg"

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: IconSize
  strokeWidth?: number | string
}
