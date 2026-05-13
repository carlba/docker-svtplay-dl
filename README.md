# docker-svtplay-dl

A Node/TypeScript wrapper for `svtplay-dl` with optional cron-style scheduling.

## What this image does

- Installs `svtplay-dl` on Alpine Linux.
- Runs one or more full `SVTPLAY_DL_COMMANDS` entries.
- Supports `OUTPUT_DIR` as the download destination inside the container.
- Supports `CRON_PATTERN` for repeated scheduled runs.

## Build locally

```sh
docker build -t docker-svtplay-dl:latest .
```

## Run locally

```sh
mkdir -p downloads
docker run --rm \
  -e OUTPUT_DIR=/downloads \
  -e SVTPLAY_DL_COMMANDS='svtplay-dl --only-video -o "$OUTPUT_DIR" https://www.svtplay.se/video/...' \
  -e CRON_PATTERN='0 * * * *' \
  -v "$PWD/downloads:/downloads" \
  docker-svtplay-dl:latest
```

## Configuration

- `SVTPLAY_DL_COMMANDS` - One or more full `svtplay-dl` commands to run. Use a multiline value to define different commands for each download.
- `OUTPUT_DIR` - Download destination inside the container (default: `/downloads`).
- `CRON_PATTERN` - Cron-style schedule for repeated runs. Leave empty to run once and exit.

### Behavior

- If `CRON_PATTERN` is empty, the container runs the configured commands once and exits.
- If `CRON_PATTERN` is set, the container schedules repeated runs according to the cron expression.
- Only `SVTPLAY_DL_COMMANDS`, `OUTPUT_DIR`, and `CRON_PATTERN` are supported.

## Example Compose configuration

```yaml
services:
  svtplay-dl:
    build:
      context: .
      dockerfile: Dockerfile
    image: docker-svtplay-dl:latest
    container_name: svtplay-dl
    restart: unless-stopped
    environment:
      SVTPLAY_DL_COMMANDS: |
        svtplay-dl --all-last 1 --subfolder -o "$OUTPUT_DIR" https://www.svtplay.se/video/KVk3L5d/dips
      OUTPUT_DIR: /downloads
      CRON_PATTERN: '0 * * * *'
    volumes:
      - ./downloads:/downloads
```

## Notes

- `SVTPLAY_DL_COMMANDS` is required for download execution.
- `OUTPUT_DIR` is created automatically inside the container.
- Set `user: "${UID}:${GID}"` in Compose if you need host-owned files.

## GitHub Actions / GHCR

A workflow file is included at `.github/workflows/publish.yml`.

This workflow logs in to `ghcr.io` using the built-in `GITHUB_TOKEN` and pushes:

- `ghcr.io/${{ github.repository_owner }}/docker-svtplay-dl:latest`
