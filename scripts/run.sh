#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"

# Create venv if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtual environment..."
  python3 -m venv "$VENV_DIR"
fi

# Activate and install deps
source "$VENV_DIR/bin/activate"
pip install --quiet --upgrade pip
pip install --quiet numpy matplotlib

# Run the specified script
if [ -z "$1" ]; then
  echo "Usage: $0 <script.py> [args...]"
  exit 1
fi

SVG_DIR="$SCRIPT_DIR/svg"
mkdir -p "$SVG_DIR"

# Run from svg/ so output files land there
cd "$SVG_DIR"
python "$SCRIPT_DIR/$1" "${@:2}"
