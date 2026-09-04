#!/bin/bash
# Capture the simulator at 6.9" and derive the 6.5" variant.
#   ./shoot.sh 3-urge
set -e
DEV=${DEV:-AD0C88C4-8E4A-4957-A788-3579C05CE0C0}
DIR="$(cd "$(dirname "$0")" && pwd)"
xcrun simctl io "$DEV" screenshot "$DIR/6.9/$1.png" >/dev/null
cp "$DIR/6.9/$1.png" "$DIR/6.5/$1.png"
sips --resampleWidth 1284 "$DIR/6.5/$1.png" >/dev/null
sips -c 2778 1284 "$DIR/6.5/$1.png" >/dev/null
echo "$1: $(sips -g pixelWidth -g pixelHeight "$DIR/6.9/$1.png" | tail -2 | tr -d ' \n') → 6.5 1284x2778"
