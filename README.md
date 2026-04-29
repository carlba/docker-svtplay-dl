# docker-svtplay-dl

A minimal Docker wrapper for `svtplay-dl` with periodic scheduling.

## What this image does

- Installs `svtplay-dl` on Alpine Linux.
- Runs downloads on a fixed 60-second sleep loop (no cron daemon).
- Supports configurable download targets via `SVTPLAY_DL_COMMANDS`.
- Builds and pushes to GitHub Container Registry via GitHub Actions.

## Build locally

```sh
docker build -t docker-svtplay-dl:latest .
```

## Run locally

```sh
mkdir -p downloads
docker run --rm \
  -e SVTPLAY_DL_COMMANDS='svtplay-dl --only-video -o /downloads https://www.svtplay.se/video/...' \
  -v "$PWD/downloads:/downloads" \
  docker-svtplay-dl:latest
```

## Configuration

- `SVTPLAY_DL_COMMANDS` - One or more full `svtplay-dl` commands to run. Use a multiline value to define different commands for each download.
- `OUTPUT_DIR` - Download destination inside the container (default: `/downloads`).

If `SVTPLAY_DL_COMMANDS` is set, it is used for downloads.

This image runs a simple shell loop that executes `SVTPLAY_DL_COMMANDS` every 60 seconds. There is no cron daemon and `CRON_SCHEDULE` is not used.

Example Compose configuration:

```yaml
services:
  svtplay-dl:
    build:
      context: .
      dockerfile: Dockerfile
    image: docker-svtplay-dl:latest
    environment:
      SVTPLAY_DL_COMMANDS: |
        svtplay-dl --only-video -o /downloads https://www.svtplay.se/video/...
      OUTPUT_DIR: /downloads
    volumes:
      - ./downloads:/downloads
```

If you want files written inside `/downloads` to be owned by your host user, create the directory on the host first with the desired ownership, or run the container with `user: "${UID}:${GID}"` in Compose.

```sh
mkdir -p downloads
```

Files written inside `/downloads` will appear on the host with whatever ownership Docker assigns to the bind mount.

## GitHub Actions / GHCR

A workflow file is included at `.github/workflows/publish.yml`.

This workflow logs in to `ghcr.io` using the built-in `GITHUB_TOKEN` and pushes:

- `ghcr.io/${{ github.repository_owner }}/docker-svtplay-dl:latest`
