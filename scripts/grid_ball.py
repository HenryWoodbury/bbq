"""
grid_ball.py — Baseball rendering in 3D.

Coordinate system:

Y-Axis (Longitudinal): Points from home plate toward the Pitcher's Mound. (The ball travels in the negative Y direction).
X-Axis (Horizontal): Points toward First Base (catcher's right).
Z-Axis (Vertical): Points vertically toward the sky.

Rotation:

When looking from the negative to the positive direction of each vector, a positive rotation is counter-clockwise (CCW).

Roll is rotation on the Y Axis. The viewpoint is behind the catcher looking toward the mound.
Positive is counter-clockwise spiral (gyrospin) around the path of travel.

Pitch is rotation on the X Axis. The viewpoint is 3rd base looking toward 1st base.
Positive is backspin (Top of ball moves away from plate).

Yaw is rotation on the Z Axis. The viewpoint is from above (the sky) looking down at the field.
Positive is counter-clockwise sidespin (front of ball moves toward 1st base).

The origin for the rendering is the center of the ball (0, 0, 0), where the axes cross.

Arguments for yaw, pitch and roll are on the 360 coordinate system.

Rotation order:

Rotations are applied in intrinsic Yaw → Pitch → Roll order (aerospace ZYX convention applied
to this coordinate system). Yaw is applied first around the world Z axis, then pitch around the
post-yaw body X axis, then roll around the post-yaw-and-pitch body Y axis.

Arguments:

  yaw (float, degrees, default 0)
      Rotation around Z. Positive: front of ball moves toward 1st base.
  pitch (float, degrees, default 0)
      Rotation around X. Positive: top of ball moves toward mound (backspin).
  roll (float, degrees, default 0)
      Rotation around Y (path of travel). Positive: CCW gyrospin viewed from -Y.
  show_grid (bool, default False)
      Draws the 4×4×4 isometric grid box around the ball.
  show_annotations (bool, default False)
      Draws axes through the ball center, positive-direction arrowheads, italic axis labels,
      and 270° rotation arcs.
  show_stitches (bool, default True)
      Draws the 216-stitch red leather pattern.
  show_seam (bool, default False)
      Draws the underlying figure-8 seam line under the stitches.

Annotation system:

When show_annotations is True, the renderer overlays:
  - Axes through the ball center, one per cardinal direction. Each axis is drawn as two
    half-segments split at the sphere surface; the back half is rendered before the ball
    fill (occluded by the ball) and the front half on top, giving correct painter's-
    algorithm occlusion through the ball.
  - Positive-direction arrowheads at the +X, +Y, +Z tip of each axis, pointing outward in
    the positive direction of that axis.
  - Axis labels (x, y, z) in italic Palatino just past each positive arrowhead.
  - 270° rotation arcs with arrowhead, one per rotation. Each arc is drawn perpendicular to
    the axis it describes, centered on the negative end of that axis (the yaw arc lies in
    the XY plane at -Z, the pitch arc in the YZ plane at -X, the roll arc in the XZ plane
    at -Y). The arc sweep direction matches the direction of positive rotation, with the
    arrowhead at the leading end.

Isometric grid system:

When show_grid is True, the renderer draws a body-fixed 4×4×4 cubic grid around the ball:
  - Side length = 8/3 × radius (= 4/3 × diameter); the cube is centered on the ball.
  - Five planes per axis (4 equal divisions); the middle plane of each axis passes through
    the ball center.
  - 75 grid line segments classified for styling: edge (cube boundary, slightly stronger
    stroke) and interior (inside the cube, lighter stroke). When annotations are also
    enabled, the through-origin lines are omitted from the grid so they do not double up
    with the colored annotation axes.
  - Painter's algorithm splits the grid into back half (drawn before ball fill) and front
    half (drawn after stitches).
  - The grid co-rotates with the ball: the grid axes always match the ball's body axes
    regardless of yaw/pitch/roll.

Rendering uses painter's algorithm: back grid lines first (covered by ball fill), then ball
stitching, then front grid lines on top.
"""
import math
import argparse

# --- DIMENSIONS ---
RADIUS = 1.45
SCALE = 200
_INV_SQRT2 = 1.0 / math.sqrt(2.0)

# --- STITCHING (regulation 216 threads) ---
STITCH_COUNT = 216
STITCH_SPREAD = 0.2
CHEVRON_OFFSET = 0.04
THREAD_WIDTH = 8
THREAD_WIDTH_EDGE = 4
SEAM_WIDTH = 6

# --- GRID ---
# Grid side = 4/3 * ball diameter; 4 equal divisions so spacing = ball_radius * 2/3.
# Middle gridlines in each axis align with ball center (origin).
GRID_HALF = RADIUS * 4 / 3
GRID_DIVS = 4

AXIS_COLOR = '#A1A1AA'

# --- SEAM (Thompson figure-8 parametrization) ---
_SEAM_A = 0.42
_SEAM_NZ_SCALE = 2 * math.sqrt(_SEAM_A - _SEAM_A**2)
_SEAM_TANGENT_NZ_SCALE = 4 * math.sqrt(_SEAM_A - _SEAM_A**2)


def _seam_point(t: float):
    """Unit vector on the figure-8 seam at parameter t."""
    nx = math.cos(t) + _SEAM_A * math.cos(3 * t)
    ny = math.sin(t) - _SEAM_A * math.sin(3 * t)
    nz = _SEAM_NZ_SCALE * math.sin(2 * t)
    mag = math.sqrt(nx * nx + ny * ny + nz * nz)
    return nx / mag, ny / mag, nz / mag


def _seam_tangent(t: float):
    """Unit tangent to the figure-8 seam at parameter t."""
    tx = -math.sin(t) - 3 * _SEAM_A * math.sin(3 * t)
    ty = math.cos(t) - 3 * _SEAM_A * math.cos(3 * t)
    tz = _SEAM_TANGENT_NZ_SCALE * math.cos(2 * t)
    mag = math.sqrt(tx * tx + ty * ty + tz * tz)
    return tx / mag, ty / mag, tz / mag


def _make_rotators(yaw_deg: float, pitch_deg: float, roll_deg: float):
    """Build (rotate_3d, rotate_ball) closures for the given orientation."""
    y_rad, p_rad, r_rad = [math.radians(a) for a in (yaw_deg, pitch_deg, roll_deg)]
    cos_y, sin_y = math.cos(y_rad), math.sin(y_rad)
    cos_p, sin_p = math.cos(p_rad), math.sin(p_rad)
    cos_r, sin_r = math.cos(r_rad), math.sin(r_rad)

    def rotate_3d(x, y, z):
        # Intrinsic Yaw → Pitch → Roll = R_z · R_x · R_y · p_body, applied right-to-left.
        # Roll (around world Y), positive sends +Z → -X
        xa = x * cos_r - z * sin_r
        za = x * sin_r + z * cos_r
        # Pitch (around world X), positive sends +Z → +Y
        yb = y * cos_p + za * sin_p
        zb = -y * sin_p + za * cos_p
        # Yaw (around world Z), positive sends -Y → +X
        xc = xa * cos_y - yb * sin_y
        yc = xa * sin_y + yb * cos_y
        # Camera: batter's POV. screen_right = world X, screen_up = world Z.
        # Depth = -world_Y so that -Y (toward batter) is close to the viewer and
        # +Y (toward the mound) is far — needed for the angular right-hand rule to
        # reveal the spin axis correctly when curling fingers along the rotation arcs.
        return xc, zb, -yc

    def rotate_ball(x, y, z):
        # Stitch design → ball body frame: 45° rotation around body Z so the leather
        # panel center faces the viewer.
        xr = (x + y) * _INV_SQRT2
        yr = (-x + y) * _INV_SQRT2
        return rotate_3d(xr, yr, z)

    return rotate_3d, rotate_ball


def _grid_segments() -> list:
    """Return all 75 grid line segments as (p1, p2, is_edge, is_through_origin) tuples."""
    pos = [GRID_HALF * (2 * i / GRID_DIVS - 1) for i in range(GRID_DIVS + 1)]
    H = GRID_HALF
    segs = []

    def classify(c1, c2):
        is_through_origin = (c1 == 0.0 and c2 == 0.0)
        is_edge = (abs(c1) == H and abs(c2) == H)
        return is_edge, is_through_origin

    for y in pos:
        for z in pos:
            segs.append(((-H, y, z), (H, y, z), *classify(y, z)))
    for x in pos:
        for z in pos:
            segs.append(((x, -H, z), (x, H, z), *classify(x, z)))
    for x in pos:
        for y in pos:
            segs.append(((x, y, -H), (x, y, H), *classify(x, y)))
    return segs


def _seam_polylines(rotate_ball, num_pts, r_px, center):
    """Walk the figure-8 seam, returning visible-arc point-strings (split where the
    seam crosses behind the sphere)."""
    segments = []
    current = []
    for i in range(num_pts + 1):
        t = (i / num_pts) * 4 * math.pi
        nx, ny, nz = _seam_point(t)
        rx, ry, rz = rotate_ball(nx, ny, nz)
        if rz > 0:
            current.append(f"{center + rx * r_px:.2f},{center - ry * r_px:.2f}")
        elif current:
            segments.append(current)
            current = []
    if current:
        segments.append(current)
    return segments


def get_baseball_grid_svg(
    yaw: float,
    pitch: float,
    roll: float,
    show_grid: bool = False,
    show_annotations: bool = False,
    show_stitches: bool = True,
    show_seam: bool = False,
) -> str:
    r_px = RADIUS * SCALE
    axis_half = GRID_HALF * 1.5  # axes extend 50% beyond grid
    if show_annotations:
        extent = axis_half
    elif show_grid:
        extent = GRID_HALF
    else:
        extent = RADIUS
    grid_radius_px = extent * math.sqrt(3) * SCALE
    padding = 80
    canvas_size = (grid_radius_px + padding) * 2
    center = canvas_size / 2
    rotate_3d, rotate_ball = _make_rotators(yaw, pitch, roll)

    def proj(rx, ry):
        return center + rx * SCALE, center - ry * SCALE

    def line_svg(sx1, sy1, sx2, sy2, color, width, opacity):
        return (
            f'<line x1="{sx1:.2f}" y1="{sy1:.2f}" x2="{sx2:.2f}" y2="{sy2:.2f}" '
            f'stroke="{color}" stroke-width="{width}" opacity="{opacity}"/>'
        )

    def axis_arrow_svg(tip_world):
        # Arrowhead at `tip_world`, pointing radially outward from origin.
        back_world = tuple(c * 0.88 for c in tip_world)
        rx_t, ry_t, _ = rotate_3d(*tip_world)
        rx_b, ry_b, _ = rotate_3d(*back_world)
        tip_sx, tip_sy = proj(rx_t, ry_t)
        back_sx, back_sy = proj(rx_b, ry_b)
        adx, ady = tip_sx - back_sx, tip_sy - back_sy
        alen = math.sqrt(adx * adx + ady * ady)
        if alen <= 1e-6:
            return ''
        adx, ady = adx / alen, ady / alen
        apx, apy = -ady, adx
        arrow_len, arrow_half_w = 20, 8
        base_x = tip_sx - adx * arrow_len
        base_y = tip_sy - ady * arrow_len
        pts = (
            f"{tip_sx:.2f},{tip_sy:.2f} "
            f"{base_x + apx * arrow_half_w:.2f},{base_y + apy * arrow_half_w:.2f} "
            f"{base_x - apx * arrow_half_w:.2f},{base_y - apy * arrow_half_w:.2f}"
        )
        return f'<polygon points="{pts}" fill="{AXIS_COLOR}" opacity="0.9"/>'

    def arc_indicator_svg(arc_center, u, v, radius, label, gap_dir, n=60):
        gx = gap_dir[0]*u[0] + gap_dir[1]*u[1] + gap_dir[2]*u[2]
        gy = gap_dir[0]*v[0] + gap_dir[1]*v[1] + gap_dir[2]*v[2]
        a_start = math.atan2(gy, gx) + math.pi / 4

        pts_2d = []
        for i in range(n + 1):
            t = a_start + (i / n) * 1.5 * math.pi
            ct, st = math.cos(t), math.sin(t)
            rx, ry, _ = rotate_3d(
                arc_center[0] + radius * (ct * u[0] + st * v[0]),
                arc_center[1] + radius * (ct * u[1] + st * v[1]),
                arc_center[2] + radius * (ct * u[2] + st * v[2]),
            )
            pts_2d.append(proj(rx, ry))

        pts_str = ' '.join(f'{sx:.2f},{sy:.2f}' for sx, sy in pts_2d)
        items = [
            f'<polyline points="{pts_str}" fill="none" stroke="{AXIS_COLOR}" '
            f'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>'
        ]

        (bx, by), (tx, ty) = pts_2d[-2], pts_2d[-1]
        dx, dy = tx - bx, ty - by
        dl = math.sqrt(dx * dx + dy * dy)
        if dl > 1e-6:
            dx, dy = dx / dl, dy / dl
            apx_, apy_ = -dy, dx
            arr_len, arr_w = 10, 5
            bax, bay = tx - dx * arr_len, ty - dy * arr_len
            items.append(
                f'<polygon points="{tx:.2f},{ty:.2f} '
                f'{bax + apx_ * arr_w:.2f},{bay + apy_ * arr_w:.2f} '
                f'{bax - apx_ * arr_w:.2f},{bay - apy_ * arr_w:.2f}" '
                f'fill="{AXIS_COLOR}" opacity="0.85"/>'
            )

        cm, sm = math.cos(a_start + 0.75 * math.pi), math.sin(a_start + 0.75 * math.pi)
        lr = radius * 1.6
        lrx, lry, _ = rotate_3d(
            arc_center[0] + lr * (cm * u[0] + sm * v[0]),
            arc_center[1] + lr * (cm * u[1] + sm * v[1]),
            arc_center[2] + lr * (cm * u[2] + sm * v[2]),
        )
        lsx, lsy = proj(lrx, lry)
        items.append(
            f'<text x="{lsx:.2f}" y="{lsy:.2f}" '
            f'font-family="Palatino, \'Palatino Linotype\', \'Book Antiqua\', Georgia, serif" '
            f'font-style="italic" font-size="28" fill="{AXIS_COLOR}" '
            f'text-anchor="middle" dominant-baseline="middle" opacity="0.85">{label}</text>'
        )
        return items

    svg = [
        f'<svg width="{canvas_size:.0f}" height="{canvas_size:.0f}" '
        f'viewBox="0 0 {canvas_size:.4f} {canvas_size:.4f}" '
        f'xmlns="http://www.w3.org/2000/svg">'
    ]

    back_items, front_items = [], []

    # Grid back/front segments (annotations win for through-origin lines)
    if show_grid:
        for p1, p2, is_edge, is_through_origin in _grid_segments():
            if is_through_origin and show_annotations:
                continue
            rx1, ry1, rz1 = rotate_3d(*p1)
            rx2, ry2, rz2 = rotate_3d(*p2)
            sx1, sy1 = proj(rx1, ry1)
            sx2, sy2 = proj(rx2, ry2)
            color, width, opacity = ('#555', 1.5, 0.6) if is_edge else ('#888', 1.0, 0.35)
            avg_z = (rz1 + rz2) / 2
            line = line_svg(sx1, sy1, sx2, sy2, color, width, opacity)
            (back_items if avg_z < 0 else front_items).append((avg_z, line))

    # Annotation axis half-segments through the ball
    if show_annotations:
        L, R = axis_half, RADIUS
        for p1, p2 in [
            ((-L, 0, 0), (-R, 0, 0)),
            (( R, 0, 0), ( L, 0, 0)),
            ((0, -L, 0), (0, -R, 0)),
            ((0,  R, 0), (0,  L, 0)),
            ((0, 0, -L), (0, 0, -R)),
            ((0, 0,  R), (0, 0,  L)),
        ]:
            rx1, ry1, rz1 = rotate_3d(*p1)
            rx2, ry2, rz2 = rotate_3d(*p2)
            sx1, sy1 = proj(rx1, ry1)
            sx2, sy2 = proj(rx2, ry2)
            avg_z = (rz1 + rz2) / 2
            line = line_svg(sx1, sy1, sx2, sy2, AXIS_COLOR, 5, 0.9)
            (back_items if avg_z < 0 else front_items).append((avg_z, line))

    back_items.sort(key=lambda e: e[0])
    front_items.sort(key=lambda e: e[0])

    svg.extend(item for _, item in back_items)

    svg.append(f'<circle cx="{center:.2f}" cy="{center:.2f}" r="{r_px}" fill="#FDFDF5"/>')

    if show_seam:
        for points in _seam_polylines(rotate_ball, 1000, r_px, center):
            svg.append(
                f'<polyline points="{" ".join(points)}" fill="none" '
                f'stroke="#D6D4C8" stroke-width="{SEAM_WIDTH}" stroke-linecap="round"/>'
            )

    if show_stitches:
        for i in range(STITCH_COUNT):
            t = (i / STITCH_COUNT) * 4 * math.pi
            nx, ny, nz = _seam_point(t)
            tx, ty, tz = _seam_tangent(t)
            # Binormal: surface-tangent perpendicular to the seam tangent (n × t).
            bx, by, bz = ny * tz - nz * ty, nz * tx - nx * tz, nx * ty - ny * tx
            b_mag = math.sqrt(bx * bx + by * by + bz * bz)
            bx, by, bz = bx / b_mag, by / b_mag, bz / b_mag
            # Destination point: chevron offset along the seam tangent (same for both sides).
            dx, dy, dz = (
                nx + tx * CHEVRON_OFFSET,
                ny + ty * CHEVRON_OFFSET,
                nz + tz * CHEVRON_OFFSET,
            )
            for side in (1, -1):
                # Puncture point on the hide, offset along the binormal away from the seam.
                spread = side * STITCH_SPREAD / 2
                px_, py_, pz_ = nx + bx * spread, ny + by * spread, nz + bz * spread
                d3x, d3y, d3z = dx - px_, dy - py_, dz - pz_
                d3m = math.sqrt(d3x * d3x + d3y * d3y + d3z * d3z)
                if d3m > 1e-10:
                    _, _, rz_dir = rotate_ball(d3x / d3m, d3y / d3m, d3z / d3m)
                else:
                    rz_dir = 0.0
                cos_theta = abs(rz_dir)
                pts_2d = []
                rz_vals = []
                visible = True
                for x, y, z in [(px_, py_, pz_), (dx, dy, dz)]:
                    m = math.sqrt(x * x + y * y + z * z)
                    rx, ry, rz = rotate_ball(x / m, y / m, z / m)
                    if rz <= 0:
                        visible = False
                    pts_2d.append((center + rx * r_px, center - ry * r_px))
                    rz_vals.append(rz)
                if not visible:
                    continue
                (x1, y1), (x2, y2) = pts_2d
                # Threads aimed toward the viewer (cos_theta ≈ 1) keep their full width;
                # threads running across the limb taper to THREAD_WIDTH_EDGE.
                rz_avg = (rz_vals[0] + rz_vals[1]) / 2
                d_pos = math.sqrt(max(0.0, 1.0 - rz_avg ** 2))
                effective_d = d_pos * (1.0 - cos_theta)
                if effective_d <= 0.5:
                    w = THREAD_WIDTH
                else:
                    frac = (effective_d - 0.5) / 0.5
                    w = THREAD_WIDTH + (THREAD_WIDTH_EDGE - THREAD_WIDTH) * frac
                svg.append(
                    f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" '
                    f'stroke="#D32F2F" stroke-width="{w:.2f}" stroke-linecap="round"/>'
                )

    svg.append(
        f'<circle cx="{center:.2f}" cy="{center:.2f}" r="{r_px}" '
        f'fill="none" stroke="#ccc" stroke-width="0.5"/>'
    )

    svg.extend(item for _, item in front_items)

    if show_annotations:
        line_tip = axis_half
        for tip in [(line_tip, 0, 0), (0, line_tip, 0), (0, 0, line_tip)]:
            arrow = axis_arrow_svg(tip)
            if arrow:
                svg.append(arrow)
        label_dist = line_tip * 1.18
        for tip, name in (
            ((label_dist, 0, 0), 'x'),
            ((0, label_dist, 0), 'y'),
            ((0, 0, label_dist), 'z'),
        ):
            rx, ry, _ = rotate_3d(*tip)
            sx, sy = proj(rx, ry)
            svg.append(
                f'<text x="{sx:.2f}" y="{sy:.2f}" '
                f'font-family="Palatino, \'Palatino Linotype\', \'Book Antiqua\', Georgia, serif" '
                f'font-style="italic" font-size="52" '
                f'fill="{AXIS_COLOR}" text-anchor="middle" dominant-baseline="middle" '
                f'opacity="0.9">{name}</text>'
            )

        arc_r = GRID_HALF * 0.19
        arc_d = GRID_HALF * 1.2
        svg.extend(arc_indicator_svg(
            (0, 0, -arc_d), (1, 0, 0), (0, 1, 0), arc_r, 'yaw', (0, -1, 0)
        ))
        svg.extend(arc_indicator_svg(
            (-arc_d, 0, 0), (0, 0, 1), (0, 1, 0), arc_r, 'pitch', (0, 0, -1)
        ))
        svg.extend(arc_indicator_svg(
            (0, -arc_d, 0), (1, 0, 0), (0, 0, 1), arc_r, 'roll', (0, 0, -1)
        ))

    svg.append('</svg>')
    return "\n".join(svg)


def get_baseball_icon_svg(yaw: float, pitch: float, roll: float) -> str:
    """Render a 24×24 SVG of the seam path only, using `currentColor` strokes and no fill,
    suitable for inline UI use as an icon. Stitches, grid, and annotations are not drawn."""
    canvas_size = 24
    center = 12
    r_px = 10  # leaves a 2px stroke margin
    _, rotate_ball = _make_rotators(yaw, pitch, roll)

    svg = [
        f'<svg width="{canvas_size}" height="{canvas_size}" '
        f'viewBox="0 0 {canvas_size} {canvas_size}" '
        f'fill="none" stroke="currentColor" stroke-width="2" '
        f'stroke-linecap="round" stroke-linejoin="round" '
        f'xmlns="http://www.w3.org/2000/svg">',
        f'  <circle cx="{center}" cy="{center}" r="{r_px}"/>',
    ]
    for points in _seam_polylines(rotate_ball, 500, r_px, center):
        svg.append(f'  <polyline points="{" ".join(points)}"/>')
    svg.append('</svg>')
    return "\n".join(svg)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a baseball SVG with optional 4×4×4 isometric grid and rotation annotations."
    )
    parser.add_argument("--yaw", type=float, default=0.0, help="Yaw angle in degrees.")
    parser.add_argument("--pitch", type=float, default=0.0, help="Pitch angle in degrees.")
    parser.add_argument("--roll", type=float, default=0.0, help="Roll angle in degrees.")
    parser.add_argument("--grid", action="store_true",
                        help="Draw the 4×4×4 isometric grid box.")
    parser.add_argument("--annotations", action="store_true",
                        help="Draw axes through the ball with positive-direction arrows, "
                             "labels, and 270° rotation arcs.")
    parser.add_argument("--no-stitches", action="store_true",
                        help="Suppress the red stitch pattern.")
    parser.add_argument("--seam", action="store_true",
                        help="Draw the underlying figure-8 seam line.")
    parser.add_argument("--icon", action="store_true",
                        help="Output a 24×24 inline icon (seam-only, currentColor stroke). "
                             "Other render flags are ignored.")
    parser.add_argument("-o", "--output", type=str, default="grid_ball.svg")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.icon:
        svg = get_baseball_icon_svg(args.yaw, args.pitch, args.roll)
    else:
        svg = get_baseball_grid_svg(
            args.yaw, args.pitch, args.roll,
            show_grid=args.grid,
            show_annotations=args.annotations,
            show_stitches=not args.no_stitches,
            show_seam=args.seam,
        )
    with open(args.output, "w") as f:
        f.write(svg)
    print(f"Generated '{args.output}' (yaw={args.yaw}, pitch={args.pitch}, roll={args.roll}).")
