#!/bin/sh
set -eu

mkdir -p "$OUTPUT_DIR"
mkdir -p /tmp/crontabs

if [ -n "${SVTPLAY_DL_COMMANDS:-}" ]; then
  printf '%s\n' "$SVTPLAY_DL_COMMANDS" > /tmp/svtplay-dl-commands.txt
fi

cat > /tmp/crontabs/root <<EOF
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
OUTPUT_DIR=$OUTPUT_DIR
CRON_SCHEDULE=$CRON_SCHEDULE

$CRON_SCHEDULE /usr/local/bin/download.sh >> /var/log/svtplay-dl.log 2>&1
EOF

touch /var/log/svtplay-dl.log
# Forward cron job output to container stdout for easier Docker logging
tail -F /var/log/svtplay-dl.log &
exec crond -f -c /tmp/crontabs
