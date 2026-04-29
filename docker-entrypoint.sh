#!/bin/sh

if [ -n "${SVTPLAY_DL_COMMANDS:-}" ]; then
  printf '%s\n' "$SVTPLAY_DL_COMMANDS" > /tmp/svtplay-dl-commands.txt
fi

run_download() {
  if [ -n "${SVTPLAY_DL_COMMANDS:-}" ]; then
    if [ -f /tmp/svtplay-dl-commands.txt ]; then
      while IFS= read -r cmd; do
        [ -z "$cmd" ] && continue
        echo "Running: $cmd"
        sh -c "$cmd"
      done < /tmp/svtplay-dl-commands.txt
      exit 0
    fi
  fi
  echo "No commands configured. Set SVTPLAY_DL_COMMANDS." >&2
  exit 1

}

run_download
while true; do
  sleep 60
  run_download
done
