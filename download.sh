#!/bin/sh
set -eu

if [ -n "${SVTPLAY_DL_COMMANDS:-}" ]; then
  printf '%s\n' "$SVTPLAY_DL_COMMANDS" > /tmp/svtplay-dl-commands.txt
fi

if [ -f /tmp/svtplay-dl-commands.txt ]; then
  while IFS= read -r cmd; do
    [ -z "$cmd" ] && continue
    echo "Running: $cmd"
    su-exec svtplay sh -c "$cmd"
  done < /tmp/svtplay-dl-commands.txt
  exit 0
fi

echo "No commands configured. Set SVTPLAY_DL_COMMANDS." >&2
exit 1
