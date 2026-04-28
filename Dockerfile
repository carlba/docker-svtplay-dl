FROM python:3.12-alpine

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apk add --no-cache tzdata ca-certificates cronie ffmpeg su-exec
RUN pip install --no-cache-dir svtplay-dl

RUN addgroup -S svtplay && adduser -S -G svtplay svtplay

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY download.sh /usr/local/bin/download.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh /usr/local/bin/download.sh

VOLUME ["/downloads"]

ENV OUTPUT_DIR=/downloads
ENV CRON_SCHEDULE="0 3 * * *"
ENV SVTPLAY_DL_COMMANDS=""

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
