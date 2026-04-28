FROM python:3.12-alpine

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apk add --no-cache tzdata ca-certificates cronie ffmpeg su-exec
RUN pip install --no-cache-dir svtplay-dl

RUN addgroup -S svtplay \
 && adduser -S -G svtplay -h /home/svtplay -s /bin/sh svtplay

RUN mkdir -p /downloads /var/log /var/run /home/svtplay/.cache \
 && chown -R svtplay:svtplay /downloads /var/log /var/run /home/svtplay/.cache \
 && chmod 1777 /var/run

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY download.sh /usr/local/bin/download.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh /usr/local/bin/download.sh

VOLUME ["/downloads"]

ENV OUTPUT_DIR=/downloads
ENV CRON_SCHEDULE="0 3 * * *"
ENV SVTPLAY_DL_COMMANDS=""

# Start as root so the entrypoint can fix bind-mount ownership, then
# it drops privileges to the svtplay user via su-exec before any downloads run.
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
