import math
import argparse

# --- CONSTANTS ---
RADIUS = 1.45      
SCALE  = 200       
YAW, PITCH, ROLL = 0, 0, 0 # See docs/ball_svg.md

def get_baseball_svg(yaw: float, pitch: float, roll: float, is_icon: bool = False) -> str:
    if is_icon:
        canvas_size = 24
        center = 12
        r_px = 10  # Leaves 2px margin for the stroke
        stroke_width = 2
        stroke_color = "currentColor"
        fill_color = "none"
    else:
        r_px = RADIUS * SCALE
        padding = 50
        canvas_size = (r_px * 2) + padding
        center = canvas_size / 2
        stroke_width = 6
        stroke_color = "black"
        fill_color = "white"

    y_rad, p_rad, r_rad = [math.radians(a) for a in (yaw, pitch, roll)]

    def rotate_3d(x, y, z):
        # Pitch -> Yaw -> Roll
        y1, z1 = y*math.cos(p_rad) - z*math.sin(p_rad), y*math.sin(p_rad) + z*math.cos(p_rad)
        x2, z2 = x*math.cos(y_rad) + z1*math.sin(y_rad), -x*math.sin(y_rad) + z1*math.cos(y_rad)
        x3, y3 = x2*math.cos(r_rad) - y1*math.sin(r_rad), x2*math.sin(r_rad) + y1*math.cos(r_rad)
        return x3, y3, z2

    # SVG Header
    svg = [
        f'<svg width="{canvas_size}" height="{canvas_size}" '
        f'viewBox="0 0 {canvas_size} {canvas_size}" '
        f'fill="none" stroke="{stroke_color}" stroke-width="{stroke_width}" '
        f'stroke-linecap="round" stroke-linejoin="round" '
        f'xmlns="http://www.w3.org/2000/svg">'
    ]
    
    # 1. Base Sphere
    svg.append(f'  <circle cx="{center}" cy="{center}" r="{r_px}" fill="{fill_color}"/>')

    # 2. Seam Path
    a = 0.42     
    num_seam_pts = 500 if is_icon else 1000
    current_segment = []
    
    for i in range(num_seam_pts + 1):
        t = (i / num_seam_pts) * 4 * math.pi
        nx = math.cos(t) + a * math.cos(3 * t)
        ny = math.sin(t) - a * math.sin(3 * t)
        nz = 2 * math.sqrt(a - a**2) * math.sin(2 * t)
        mag = math.sqrt(nx**2 + ny**2 + nz**2)
        
        rx, ry, rz = rotate_3d(nx/mag, ny/mag, nz/mag)
        
        if rz > 0:
            px = center + rx * r_px
            py = center - ry * r_px
            current_segment.append(f"{px:.2f},{py:.2f}")
        else:
            if current_segment:
                svg.append(f'  <polyline points="{" ".join(current_segment)}"/>')
                current_segment = []
    if current_segment:
        svg.append(f'  <polyline points="{" ".join(current_segment)}"/>')

    svg.append('</svg>')
    return "\n".join(svg)

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a 2D baseball SVG with only the seam path rendered."
    )
    parser.add_argument("--yaw", type=float, default=YAW, help="Yaw angle (default: %(default)s)")
    parser.add_argument("--pitch", type=float, default=PITCH, help="Pitch angle (default: %(default)s)")
    parser.add_argument("--roll", type=float, default=ROLL, help="Roll angle (default: %(default)s)")
    parser.add_argument("--icon", action="store_true", help="Output a 24x24 optimized icon")
    parser.add_argument("-o", "--output", type=str, default=None, help="Output filename")
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()

    if args.output is None:
        prefix = "icon" if args.icon else "seam"
        args.output = f"{prefix}-y{args.yaw:.0f}-p{args.pitch:.0f}-r{args.roll:.0f}.svg"

    svg = get_baseball_svg(args.yaw, args.pitch, args.roll, is_icon=args.icon)

    with open(args.output, "w") as f:
        f.write(svg)

    print(
        f"Generated Seam Ball to '{args.output}' "
    )
