#!/usr/bin/env bash
# Re-encode demo screen recording to H.264 + AAC for reliable in-browser playback
# (fixes common "audio only / black video" with HEVC or HDR exports from macOS).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IN="${1:-$ROOT/frontend/public/demo/recording.mp4}"
OUT="${2:-$ROOT/frontend/public/demo/recording.web.mp4}"

if [[ ! -f "$IN" ]]; then
  echo "Input not found: $IN" >&2
  exit 1
fi
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found. Install with: brew install ffmpeg" >&2
  exit 1
fi

echo "Encoding: $IN -> $OUT"
ffmpeg -y -i "$IN" \
  -c:v libx264 -pix_fmt yuv420p -crf 23 -preset medium \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  "$OUT"

echo "Done. Open the new file in the browser (or rename to recording.mp4 after backing up the original)."
