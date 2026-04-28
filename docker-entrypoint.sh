#!/bin/sh
set -eu

mkdir -p "$OUTPUT_DIR"

if [ -n "${SVTPLAY_DL_COMMANDS:-}" ]; then
  printf '%s\n' "$SVTPLAY_DL_COMMANDS" > /tmp/svtplay-dl-commands.txt
fi

run_download() {
  if [ -n "${SVTPLAY_DL_COMMANDS:-}" ]; then
    /usr/local/bin/download.sh || true
  fi
}

# Execute immediately and then repeat every 60 seconds
run_download
while true; do
  sleep 60
  run_download
done
