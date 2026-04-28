FROM python:3.12-alpine

ARG USER_ID=1000
ARG GROUP_ID=1000
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apk add --no-cache tzdata ca-certificates cronie ffmpeg su-exec
RUN pip install --no-cache-dir svtplay-dl

RUN addgroup -g "$GROUP_ID" -S svtplay \
 && adduser -u "$USER_ID" -S -G svtplay -h /home/svtplay -s /bin/sh svtplay

RUN mkdir -p /downloads /var/log && chown -R svtplay:svtplay /downloads /var/log

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY download.sh /usr/local/bin/download.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh /usr/local/bin/download.sh

VOLUME ["/downloads"]

ENV OUTPUT_DIR=/downloads
ENV CRON_SCHEDULE="0 3 * * *"
ENV SVTPLAY_DL_COMMANDS=""

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
