FROM python:3.12-alpine

RUN apk add --no-cache tzdata ca-certificates ffmpeg su-exec
RUN pip install --no-cache-dir svtplay-dl

COPY docker-entrypoint.sh /tmp/svtplay-dl/docker-entrypoint.sh
RUN chmod +x /tmp/svtplay-dl/docker-entrypoint.sh

VOLUME ["/downloads"]

CMD ["/tmp/svtplay-dl/docker-entrypoint.sh"]
