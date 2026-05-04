"""
grid_ball.py — Baseball enclosed in a transparent 4×4×4 isometric grid.

The grid is body-fixed: it co-rotates with the ball, establishing x/y/z axes
that are always meaningful relative to the ball regardless of yaw/pitch/roll.

Rendering uses painter's algorithm: back grid lines first (covered by ball fill),
then ball stitching, then front grid lines on top.
"""
import math
import random
import argparse

# --- FLAGS ---
SHOW_SEAM = False
USE_JITTER = False
SHOW_PUNCTURES = False

# --- DIMENSIONS ---
RADIUS = 1.45
SCALE = 200
YAW, PITCH, ROLL = 0, 0, 0
_INV_SQRT2 = 1.0 / math.sqrt(2.0)

# --- STITCHING (regulation 216 threads) ---
STITCH_COUNT = 216
STITCH_SPREAD = 0.2
CHEVRON_OFFSET = 0.04
ZIPPER_STAGGER = 0.0
THREAD_WIDTH = 8
THREAD_WIDTH_EDGE = 4
SEAM_WIDTH = 6
PUNCTURE_SIZE = 4

# --- GRID ---
# Grid side = 4/3 * ball diameter; 4 equal divisions so spacing = ball_radius * 2/3.
# Middle gridlines in each axis align with ball center (origin).
GRID_HALF = RADIUS * 4 / 3   # = 4/3 * radius → full side = 8/3 * radius ≈ 4/3 * diameter
GRID_DIVS = 4                 # 4 equal divisions per axis → 5 planes, center plane at 0

AXIS_COLORS = {'x': '#D32F2F', 'y': '#2E7D32', 'z': '#1565C0'}


def _grid_segments() -> list:
    """Return all 75 grid line segments as (p1, p2, axis, seg_type) tuples.

    seg_type is one of: 'axis' (through-origin line), 'edge' (cube boundary),
    or 'interior' (all others).
    """
    pos = [GRID_HALF * (2 * i / GRID_DIVS - 1) for i in range(GRID_DIVS + 1)]
    H = GRID_HALF
    segs = []

    def classify(c1, c2):
        if c1 == 0.0 and c2 == 0.0:
            return 'axis'
        if abs(c1) == H and abs(c2) == H:
            return 'edge'
        return 'interior'

    for y in pos:
        for z in pos:
            segs.append(((-H, y, z), (H, y, z), 'x', classify(y, z)))
    for x in pos:
        for z in pos:
            segs.append(((x, -H, z), (x, H, z), 'y', classify(x, z)))
    for x in pos:
        for y in pos:
            segs.append(((x, y, -H), (x, y, H), 'z', classify(x, y)))
    return segs


def get_baseball_grid_svg(
    yaw: float,
    pitch: float,
    roll: float,
    show_seam: bool = SHOW_SEAM,
    no_grid: bool = False,
) -> str:
    r_px = RADIUS * SCALE
    # Canvas sized to contain grid corners at any rotation (max 3D radius = GRID_HALF * √3)
    grid_radius_px = GRID_HALF * math.sqrt(3) * SCALE
    padding = 80
    canvas_size = (grid_radius_px + padding) * 2
    center = canvas_size / 2
    y_rad, p_rad, r_rad = [math.radians(a) for a in (yaw, pitch, roll)]

    def rotate_3d(x, y, z):
        # Face-on pre-rotation: x→right, z→up, y→depth. Grid appears as perfect square.
        xp, yp, zp = x, z, y
        y1, z1 = yp * math.cos(p_rad) - zp * math.sin(p_rad), yp * math.sin(p_rad) + zp * math.cos(p_rad)
        x2, z2 = xp * math.cos(y_rad) + z1 * math.sin(y_rad), -xp * math.sin(y_rad) + z1 * math.cos(y_rad)
        x3, y3 = x2 * math.cos(r_rad) - y1 * math.sin(r_rad), x2 * math.sin(r_rad) + y1 * math.cos(r_rad)
        return x3, y3, z2

    def rotate_ball(x, y, z):
        # Ball body frame: 45° rotation around z so leather panel center faces viewer.
        xr = (x + y) * _INV_SQRT2
        yr = (-x + y) * _INV_SQRT2
        return rotate_3d(xr, yr, z)

    def proj(rx, ry):
        return center + rx * SCALE, center - ry * SCALE

    def seg_svg(p1, p2, axis, seg_type, back):
        rx1, ry1, _ = rotate_3d(*p1)
        rx2, ry2, _ = rotate_3d(*p2)
        sx1, sy1 = proj(rx1, ry1)
        sx2, sy2 = proj(rx2, ry2)
        if seg_type == 'axis':
            color = AXIS_COLORS[axis]
            width, opacity = 2.0, 0.85
        elif seg_type == 'edge':
            color = '#555'
            width, opacity = 1.5, 0.6
        else:
            color = '#888'
            width, opacity = 1.0, 0.35
        return (
            f'<line x1="{sx1:.2f}" y1="{sy1:.2f}" x2="{sx2:.2f}" y2="{sy2:.2f}" '
            f'stroke="{color}" stroke-width="{width}" opacity="{opacity}"/>'
        )

    svg = [
        f'<svg width="{canvas_size:.0f}" height="{canvas_size:.0f}" '
        f'viewBox="0 0 {canvas_size:.4f} {canvas_size:.4f}" '
        f'xmlns="http://www.w3.org/2000/svg">'
    ]

    # Partition and sort grid segments by average Z after rotation
    if not no_grid:
        back_segs, front_segs = [], []
        for p1, p2, axis, seg_type in _grid_segments():
            _, _, rz1 = rotate_3d(*p1)
            _, _, rz2 = rotate_3d(*p2)
            avg_z = (rz1 + rz2) / 2
            entry = (avg_z, p1, p2, axis, seg_type)
            (back_segs if avg_z < 0 else front_segs).append(entry)
        back_segs.sort(key=lambda e: e[0])   # most-negative Z first
        front_segs.sort(key=lambda e: e[0])  # least-positive Z first

    # Step 1: Back grid lines (ball fill will cover these)
    if not no_grid:
        for _, p1, p2, axis, seg_type in back_segs:
            svg.append(seg_svg(p1, p2, axis, seg_type, back=True))

    # Step 2: Ball fill (opaque — covers back grid lines)
    svg.append(f'<circle cx="{center:.2f}" cy="{center:.2f}" r="{r_px}" fill="#FDFDF5"/>')

    a = 0.42  # Thompson Seam Factor

    # Step 3: Seam underlay (optional)
    if show_seam:
        num_seam_pts = 1000
        current_segment = []
        for i in range(num_seam_pts + 1):
            t = (i / num_seam_pts) * 4 * math.pi
            nx = math.cos(t) + a * math.cos(3 * t)
            ny = math.sin(t) - a * math.sin(3 * t)
            nz = 2 * math.sqrt(a - a**2) * math.sin(2 * t)
            mag = math.sqrt(nx**2 + ny**2 + nz**2)
            rx, ry, rz = rotate_ball(nx / mag, ny / mag, nz / mag)
            if rz > 0:
                current_segment.append(f"{center + rx * r_px:.2f},{center - ry * r_px:.2f}")
            else:
                if current_segment:
                    svg.append(
                        f'<polyline points="{" ".join(current_segment)}" fill="none" '
                        f'stroke="#D6D4C8" stroke-width="{SEAM_WIDTH}" stroke-linecap="round"/>'
                    )
                    current_segment = []
        if current_segment:
            svg.append(
                f'<polyline points="{" ".join(current_segment)}" fill="none" '
                f'stroke="#D6D4C8" stroke-width="{SEAM_WIDTH}" stroke-linecap="round"/>'
            )

    # Step 4: Ball stitches (verbatim from stitch_ball.py)
    random.seed(42)
    for i in range(STITCH_COUNT):
        base_t = (i / STITCH_COUNT) * 4 * math.pi
        for side in [1, -1]:
            t = base_t + (side * ZIPPER_STAGGER)
            nx = math.cos(t) + a * math.cos(3 * t)
            ny = math.sin(t) - a * math.sin(3 * t)
            nz = 2 * math.sqrt(a - a**2) * math.sin(2 * t)
            mag = math.sqrt(nx**2 + ny**2 + nz**2)
            nx, ny, nz = nx / mag, ny / mag, nz / mag
            tx = -math.sin(t) - 3 * a * math.sin(3 * t)
            ty = math.cos(t) - 3 * a * math.cos(3 * t)
            tz = 4 * math.sqrt(a - a**2) * math.cos(2 * t)
            t_mag = math.sqrt(tx**2 + ty**2 + tz**2)
            tx, ty, tz = tx / t_mag, ty / t_mag, tz / t_mag
            bx, by, bz = ny * tz - nz * ty, nz * tx - nx * tz, nx * ty - ny * tx
            b_mag = math.sqrt(bx**2 + by**2 + bz**2)
            bx, by, bz = bx / b_mag, by / b_mag, bz / b_mag
            jit_spread = STITCH_SPREAD + (random.uniform(-0.005, 0.005) if USE_JITTER else 0)
            jit_offset = CHEVRON_OFFSET + (random.uniform(-0.008, 0.008) if USE_JITTER else 0)
            px_, py_, pz_ = (
                nx + (side * bx * (jit_spread / 2)),
                ny + (side * by * (jit_spread / 2)),
                nz + (side * bz * (jit_spread / 2)),
            )
            dx, dy, dz = nx + (tx * jit_offset), ny + (ty * jit_offset), nz + (tz * jit_offset)
            d3x, d3y, d3z = dx - px_, dy - py_, dz - pz_
            d3m = math.sqrt(d3x**2 + d3y**2 + d3z**2)
            if d3m > 1e-10:
                _, _, rz_dir = rotate_ball(d3x / d3m, d3y / d3m, d3z / d3m)
            else:
                rz_dir = 0.0
            cos_theta = abs(rz_dir)
            pts_2d = []
            rz_vals = []
            visible = True
            for x, y, z in [(px_, py_, pz_), (dx, dy, dz)]:
                m = math.sqrt(x**2 + y**2 + z**2)
                rx, ry, rz = rotate_ball(x / m, y / m, z / m)
                if rz <= 0:
                    visible = False
                pts_2d.append((center + rx * r_px, center - ry * r_px))
                rz_vals.append(rz)
            if visible:
                (x1, y1), (x2, y2) = pts_2d
                rz_avg = (rz_vals[0] + rz_vals[1]) / 2
                d_pos = math.sqrt(max(0.0, 1.0 - rz_avg**2))
                effective_d = d_pos * (1.0 - cos_theta)
                if effective_d <= 0.5:
                    w = THREAD_WIDTH
                else:
                    frac = (effective_d - 0.5) / 0.5
                    w = THREAD_WIDTH + (THREAD_WIDTH_EDGE - THREAD_WIDTH) * frac
                if SHOW_PUNCTURES:
                    svg.append(
                        f'<circle cx="{x1:.2f}" cy="{y1:.2f}" r="{PUNCTURE_SIZE}" '
                        f'fill="#1A1A1A" fill-opacity="0.4"/>'
                    )
                svg.append(
                    f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" '
                    f'stroke="#D32F2F" stroke-width="{w:.2f}" stroke-linecap="round"/>'
                )

    # Step 5: Ball outline on top of stitches
    svg.append(
        f'<circle cx="{center:.2f}" cy="{center:.2f}" r="{r_px}" '
        f'fill="none" stroke="#ccc" stroke-width="0.5"/>'
    )

    # Step 6: Front grid lines on top of ball
    if not no_grid:
        for _, p1, p2, axis, seg_type in front_segs:
            svg.append(seg_svg(p1, p2, axis, seg_type, back=False))

    svg.append('</svg>')
    return "\n".join(svg)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a baseball SVG enclosed in a transparent 4×4×4 isometric grid."
    )
    parser.add_argument("--yaw", type=float, default=YAW, help="Yaw angle in degrees.")
    parser.add_argument("--pitch", type=float, default=PITCH, help="Pitch angle in degrees.")
    parser.add_argument("--roll", type=float, default=ROLL, help="Roll angle in degrees.")
    parser.add_argument("--show-seam", action="store_true", default=SHOW_SEAM)
    parser.add_argument("--no-grid", action="store_true", default=False, help="Render ball only.")
    parser.add_argument("-o", "--output", type=str, default="grid_ball.svg")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    svg = get_baseball_grid_svg(
        args.yaw, args.pitch, args.roll,
        show_seam=args.show_seam,
        no_grid=args.no_grid,
    )
    with open(args.output, "w") as f:
        f.write(svg)
    print(f"Generated '{args.output}' (yaw={args.yaw}, pitch={args.pitch}, roll={args.roll}).")
