#!/bin/sh
set -eu

# ── Privilege drop ────────────────────────────────────────────────────────────
# If we are root (e.g. default container start), fix the bind-mount ownership
# so the svtplay user can write to it, then re-exec this same script as svtplay.
# The second invocation will no longer be root and will skip this block.
if [ "$(id -u)" = "0" ]; then
  chown -R svtplay:svtplay "${OUTPUT_DIR:-/downloads}"
  exec su-exec svtplay "$0" "$@"
fi
# ─────────────────────────────────────────────────────────────────────────────

mkdir -p "$OUTPUT_DIR"
mkdir -p "$HOME/.cache"
touch /var/log/svtplay-dl.log

if [ -n "${SVTPLAY_DL_COMMANDS:-}" ]; then
  printf '%s\n' "$SVTPLAY_DL_COMMANDS" > /tmp/svtplay-dl-commands.txt
fi

run_download() {
  if [ -n "${SVTPLAY_DL_COMMANDS:-}" ]; then
    /usr/local/bin/download.sh >> /var/log/svtplay-dl.log 2>&1 || true
  fi
}

# Forward download output to container stdout for easier Docker logging
tail -F /var/log/svtplay-dl.log &

# Execute immediately and then repeat every 60 seconds
run_download
while true; do
  sleep 60
  run_download
done
