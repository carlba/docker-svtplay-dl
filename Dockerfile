FROM python:3.12-alpine

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apk add --no-cache tzdata ca-certificates ffmpeg su-exec
RUN pip install --no-cache-dir svtplay-dl

RUN addgroup -S svtplay \
 && adduser -S -G svtplay -h /home/svtplay -s /bin/sh svtplay

RUN mkdir -p /downloads /home/svtplay/.cache \
 && chown -R svtplay:svtplay /downloads /home/svtplay/.cache \
 && chmod 777 /downloads

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY download.sh /usr/local/bin/download.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh /usr/local/bin/download.sh

VOLUME ["/downloads"]

ENV HOME=/home/svtplay
ENV OUTPUT_DIR=/downloads
ENV SVTPLAY_DL_COMMANDS=""
ENV PUID=100
ENV PGID=101

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
