import type { SVGProps } from "react";

/**
 * Shared props for custom icon components, matching the Lucide icon interface.
 * Extends SVGProps so icons accept any native SVG attribute.
 */
export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}
