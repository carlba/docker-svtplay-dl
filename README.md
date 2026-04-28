# docker-svtplay-dl

A minimal Docker wrapper for `svtplay-dl` with built-in cron scheduling.

## What this image does

- Installs `svtplay-dl` on Alpine Linux.
- Runs `cron` inside the container.
- Uses `CRON_SCHEDULE` to schedule downloads.
- Supports configurable download targets via `SVTPLAY_DL_COMMANDS`.
- Builds and pushes to GitHub Container Registry via GitHub Actions.

## Build locally

```sh
docker build -t docker-svtplay-dl:latest .
```

## Run locally

```sh
docker run --rm \
  -e SVTPLAY_DL_COMMANDS='svtplay-dl --only-video -o /downloads https://www.svtplay.se/video/...' \
  -e CRON_SCHEDULE="0 3 * * *" \
  -v "$PWD/downloads:/downloads" \
  docker-svtplay-dl:latest
```

## Configuration

- `CRON_SCHEDULE` - Cron expression for when downloads should run (default: `0 3 * * *`).
- `SVTPLAY_DL_COMMANDS` - One or more full `svtplay-dl` commands to run. Use a multiline value to define different commands for each download.
- `OUTPUT_DIR` - Download destination inside the container (default: `/downloads`).

If `SVTPLAY_DL_COMMANDS` is set, it is used for downloads.

Example:

```yaml
services:
  svtplay-dl:
    image: docker-svtplay-dl:latest
    environment:
      SVTPLAY_DL_COMMANDS: |
        svtplay-dl --only-video -o /downloads https://www.svtplay.se/video/...
        svtplay-dl --only-audio -o /downloads https://www.svtplay.se/audio/...
```

## GitHub Actions / GHCR

A workflow file is included at `.github/workflows/publish.yml`.

This workflow logs in to `ghcr.io` using the built-in `GITHUB_TOKEN` and pushes:

- `ghcr.io/${{ github.repository_owner }}/docker-svtplay-dl:latest`
