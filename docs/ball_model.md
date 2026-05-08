## Baseball SVG generator

`scripts/grid_ball.py` is the single Python script that renders 2D SVGs of a baseball: stitches, seam, optional 4×4×4 isometric grid, optional rotation annotations, plus a 24×24 inline-icon mode.

It writes a single SVG file to disk and shares one orientation model (yaw/pitch/roll) across every render mode.

## Running with `run.sh`

The helper script `scripts/run.sh` sets up a virtualenv (if needed), installs Python deps, and runs the generator. SVG output lands under `scripts/svg/`.

```bash
./scripts/run.sh grid_ball.py [args...]
```

Arguments after the script name are passed straight through to the Python script.

## Render modes

The default render is the cream ball with the 216-stitch red leather pattern, no grid, no annotations, no seam. Each toggle is independent and combinable.

- **Default (stitches only)**:
  ```bash
  ./scripts/run.sh grid_ball.py -o ball.svg
  ```
- **With seam underlay**: add `--seam`.
- **With 4×4×4 isometric grid**: add `--grid`.
- **With axes, positive-direction arrows, labels, and 270° rotation arcs**: add `--annotations`.
- **Without stitches** (e.g. for a clean wireframe): add `--no-stitches`.
- **Inline icon (24×24, `currentColor` stroke, seam only)**: add `--icon`. Other render flags are ignored.

Combine freely:

```bash
./scripts/run.sh grid_ball.py --yaw 30 --pitch 15 --grid --annotations --seam -o demo.svg
./scripts/run.sh grid_ball.py --no-stitches --annotations -o axes.svg
./scripts/run.sh grid_ball.py --icon -o seam-icon.svg
```

## Orienting the ball: Yaw, Pitch, Roll

All angles are in **degrees**, on the 360° system. The full convention (axes, positive directions, view-points) is documented at the top of `scripts/grid_ball.py`. Summary:

- **Yaw (`--yaw`)** — rotation around Z (vertical). Positive: front of ball moves toward 1st base.
- **Pitch (`--pitch`)** — rotation around X (1st-base axis). Positive: top of ball moves toward the mound (backspin).
- **Roll (`--roll`)** — rotation around Y (path of travel). Positive: counter-clockwise gyrospin viewed from `-Y` (behind the catcher).

Rotations are applied in intrinsic **Yaw → Pitch → Roll** order (aerospace ZYX convention applied to this coord system).
