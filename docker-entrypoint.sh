#!/bin/sh
set -eu

mkdir -p "$OUTPUT_DIR"
chown svtplay:svtplay "$OUTPUT_DIR" || true

if [ -n "${SVTPLAY_DL_COMMANDS:-}" ]; then
  printf '%s\n' "$SVTPLAY_DL_COMMANDS" > /tmp/svtplay-dl-commands.txt
fi

cat > /etc/crontabs/root <<EOF
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
OUTPUT_DIR=$OUTPUT_DIR
SVTPLAY_DL_COMMANDS=$SVTPLAY_DL_COMMANDS
CRON_SCHEDULE=$CRON_SCHEDULE

$CRON_SCHEDULE /usr/local/bin/download.sh >> /var/log/svtplay-dl.log 2>&1
EOF

touch /var/log/svtplay-dl.log
chown svtplay:svtplay /var/log/svtplay-dl.log || true
# Forward cron job output to container stdout for easier Docker logging
exec su-exec svtplay sh -c 'tail -F /var/log/svtplay-dl.log & exec crond -f'
