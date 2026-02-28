import math
import random
import argparse

# --- CONFIGURATION FLAGS ---
USE_GRADIENT = False
SHOW_PUNCTURES = True   
USE_JITTER = True       # Adds slight randomness to stitches

# --- REALISTIC DIMENSIONS ---
RADIUS = 1.45      
SCALE  = 200       
# Orientation angles (degrees) for how the ball is viewed:
# - YAW: spin the ball left/right around the vertical axis.
# - PITCH: tilt the ball up/down (north/south) around the horizontal axis.
# - ROLL: spin the ball around the view axis (like turning a knob while looking at the logo).
YAW, PITCH, ROLL = 0, 0, 0  # Defaults; can be overridden via CLI

# STITCHING SPECS (Regulation 216 individual threads)
STITCH_COUNT = 216      # 108 pairs = 216 total threads
STITCH_SPREAD = 0.2   
CHEVRON_OFFSET = 0.01   
ZIPPER_STAGGER = 0.0075  # Creates the interleaved 'zipper' look
THREAD_WIDTH = 6
SEAM_WIDTH = 6       
PUNCTURE_SIZE = 4     

def get_baseball_svg(yaw: float, pitch: float, roll: float) -> str:
    r_px = RADIUS * SCALE
    padding = 50
    canvas_size = (r_px * 2) + padding
    center = canvas_size / 2
    y_rad, p_rad, r_rad = [math.radians(a) for a in (yaw, pitch, roll)]

    def rotate_3d(x, y, z):
        y1, z1 = y*math.cos(p_rad) - z*math.sin(p_rad), y*math.sin(p_rad) + z*math.cos(p_rad)
        x2, z2 = x*math.cos(y_rad) + z1*math.sin(y_rad), -x*math.sin(y_rad) + z1*math.cos(y_rad)
        x3, y3 = x2*math.cos(r_rad) - y1*math.sin(r_rad), x2*math.sin(r_rad) + y1*math.cos(r_rad)
        return x3, y3, z2

    svg = [f'<svg width="{canvas_size}" height="{canvas_size}" viewBox="0 0 {canvas_size} {canvas_size}" xmlns="http://www.w3.org/2000/svg">']
    
    # 1. Base Sphere
    fill_color = "#FDFDF5"
    svg.append(f'<circle cx="{center}" cy="{center}" r="{r_px}" fill="{fill_color}" stroke="#ccc" stroke-width="0.5"/>')

    a = 0.42 # Thompson Seam Factor
    
    # 2. SEAM PATH (Underlay)
    num_seam_pts = 1000
    current_segment = []
    for i in range(num_seam_pts + 1):
        t = (i / num_seam_pts) * 4 * math.pi
        nx = math.cos(t) + a * math.cos(3 * t)
        ny = math.sin(t) - a * math.sin(3 * t)
        nz = 2 * math.sqrt(a - a**2) * math.sin(2 * t)
        mag = math.sqrt(nx**2 + ny**2 + nz**2)
        rx, ry, rz = rotate_3d(nx/mag, ny/mag, nz/mag)
        if rz > 0:
            current_segment.append(f"{center + rx * r_px:.2f},{center - ry * r_px:.2f}")
        else:
            if current_segment:
                svg.append(f'<polyline points="{" ".join(current_segment)}" fill="none" stroke="#D6D4C8" stroke-width="{SEAM_WIDTH}" stroke-linecap="round"/>')
                current_segment = []
    if current_segment:
        svg.append(f'<polyline points="{" ".join(current_segment)}" fill="none" stroke="#D6D4C8" stroke-width="{SEAM_WIDTH}" stroke-linecap="round"/>')

    # 3. INTERLEAVED ZIPPER STITCHES
    random.seed(42) # Keep jitter consistent between runs
    for i in range(STITCH_COUNT):
        base_t = (i / STITCH_COUNT) * 4 * math.pi
        
        for side in [1, -1]:
            # Apply zipper stagger
            t = base_t + (side * ZIPPER_STAGGER)
            
            # Parametric Vectors
            nx = math.cos(t) + a * math.cos(3 * t)
            ny = math.sin(t) - a * math.sin(3 * t)
            nz = 2 * math.sqrt(a - a**2) * math.sin(2 * t)
            mag = math.sqrt(nx**2 + ny**2 + nz**2)
            nx, ny, nz = nx/mag, ny/mag, nz/mag
            
            tx = -math.sin(t) - 3 * a * math.sin(3 * t)
            ty =  math.cos(t) - 3 * a * math.cos(3 * t)
            tz = 4 * math.sqrt(a - a**2) * math.cos(2 * t)
            t_mag = math.sqrt(tx**2 + ty**2 + tz**2)
            tx, ty, tz = tx/t_mag, ty/t_mag, tz/t_mag

            bx, by, bz = ny*tz-nz*ty, nz*tx-nx*tz, nx*ty-ny*tx
            b_mag = math.sqrt(bx**2 + by**2 + bz**2)
            bx, by, bz = bx/b_mag, by/b_mag, bz/b_mag

            # Optional Jitter: Apply tiny random offsets to the spread and forward-pull
            jit_spread = STITCH_SPREAD + (random.uniform(-0.005, 0.005) if USE_JITTER else 0)
            jit_offset = CHEVRON_OFFSET + (random.uniform(-0.008, 0.008) if USE_JITTER else 0)

            # Puncture point (on hide) and Destination (inside seam)
            px, py, pz = nx + (side * bx * (jit_spread/2)), ny + (side * by * (jit_spread/2)), nz + (side * bz * (jit_spread/2))
            dx, dy, dz = nx + (tx * jit_offset), ny + (ty * jit_offset), nz + (tz * jit_offset)

            # Project and Cull
            pts_2d = []
            visible = True
            for x, y, z in [(px, py, pz), (dx, dy, dz)]:
                m = math.sqrt(x**2 + y**2 + z**2)
                rx, ry, rz = rotate_3d(x/m, y/m, z/m)
                if rz <= 0: visible = False
                pts_2d.append((center + rx * r_px, center - ry * r_px))

            if visible:
                (x1, y1), (x2, y2) = pts_2d

                # Draw puncture first so it sits "behind" the thread
                if SHOW_PUNCTURES:
                    svg.append(
                        f'<circle cx="{x1:.2f}" cy="{y1:.2f}" r="{PUNCTURE_SIZE}" '
                        f'fill="#1A1A1A" fill-opacity="0.4"/>'
                    )

                # Then draw thread segment on top
                svg.append(
                    f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" '
                    f'stroke="#D32F2F" stroke-width="{THREAD_WIDTH}" stroke-linecap="round"/>'
                )

    svg.append('</svg>')
    return "\n".join(svg)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate an ultra-realistic 2D baseball SVG with stitched seams."
    )
    parser.add_argument(
        "--yaw",
        type=float,
        default=YAW,
        help="Yaw angle in degrees (rotation around the vertical axis).",
    )
    parser.add_argument(
        "--pitch",
        type=float,
        default=PITCH,
        help="Pitch angle in degrees (tilt up/down).",
    )
    parser.add_argument(
        "--roll",
        type=float,
        default=ROLL,
        help="Roll angle in degrees (rotation around the view axis).",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=str,
        default="baseball_ultra_real.svg",
        help="Output SVG filename.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    svg = get_baseball_svg(args.yaw, args.pitch, args.roll)
    with open(args.output, "w") as f:
        f.write(svg)
    print(
        f"Generated Stitch Ball SVG to '{args.output}' "
        f"(yaw={args.yaw}, pitch={args.pitch}, roll={args.roll})."
    )
