## Baseball SVG generators

This project includes two Python scripts that generate 2D SVG renderings of a baseball with seams and stitches:

- **`scripts/generate_stitch_ball.py`**: Ball with seam underlay and interleaved zipper‑style stitches (216 individual threads), including optional jitter in stitch placement.
- **`scripts/generate_seam_ball.py`**: Ball with the seam path stitches, simplified for iconic use.

Both scripts:

- Use the same \(RADIUS\) and \(SCALE\) to convert inches on the ball to SVG units.
- Share the same orientation model using **Yaw**, **Pitch**, and **Roll**.
- Write a single SVG file to disk.

## Running scripts with `run.sh`

The helper script `scripts/run.sh` sets up a virtualenv (if needed), installs Python deps, and runs any of the generator scripts. It also ensures SVG output lands under `scripts/svg/`.

- **Basic usage**:

```bash
./scripts/run.sh <script.py> [args...]
```

- **Run the ultra‑realistic stitched ball**:

```bash
./scripts/run.sh generate_stitch_ball.py
```

- **Run the seam‑only ball**:

```bash
./scripts/run.sh generate_seam_ball.py
```

Any additional arguments after the script name are passed directly to the Python script, so you can control orientation and output filename from the CLI.

- **Example: stitched ball with custom orientation and output name**:

```bash
./scripts/run.sh generate_stitch_ball.py \
  --yaw 15 --pitch 140 --roll 25 \
  -o baseball_ultra_real_custom.svg
```

- **Example: seam ball with different view**:

```bash
./scripts/run.sh generate_seam_ball.py \
  --yaw 30 --pitch 90 --roll 0 \
  -o baseball_seam_sideview.svg
```

All SVGs produced via `run.sh` will appear in `scripts/svg/`.

## Orienting the ball: Yaw, Pitch, Roll

Both generator scripts expose three orientation parameters, in **degrees**, that control how the ball is viewed before projection to 2D:

- **Yaw (`--yaw`)**:  
  Spin the ball **left/right** around the vertical axis (imagine rotating the ball so a different longitude faces the camera).

- **Pitch (`--pitch`)**:  
  Tilt the ball **up/down** (north/south) around the horizontal axis (imagine raising or lowering the visible seam relative to the center).

- **Roll (`--roll`)**:  
  Spin the ball around the **view axis** (like twisting a knob while looking straight at the logo; the seam pattern rotates within the frame).

Practical tips:

- **Small yaw changes** move which part of the seam is centered in the image.
- **Pitch** is useful to show more of the "top" or "bottom" half of the ball.
- **Roll** keeps the same patch of leather facing you, but rotates the seam pattern within the circle.

Because the scripts use the same orientation convention, you can copy a yaw/pitch/roll triple from one script to the other and get a comparable camera view across seam‑only and stitched renders.

