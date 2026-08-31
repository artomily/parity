#!/usr/bin/env bash
# Rasterise the brand SVGs to the PNGs X actually accepts on upload.
# Uses the headless Chrome that Remotion already downloaded, so there is no
# extra toolchain to install (rsvg/ImageMagick are not required).
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="video/node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell"

render() { # svg width height
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=2 --window-size="$2,$3" \
    --screenshot="brand/$(basename "$1" .svg).png" "file://$PWD/$1" >/dev/null 2>&1
  echo "  brand/$(basename "$1" .svg).png  ($(( $2 * 2 ))x$(( $3 * 2 )))"
}

render brand/x-banner.svg 1500 500
render brand/avatar.svg    400 400
render brand/logo.svg      320 320
