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
  --user "$(id -u):$(id -g)" \
  -e SVTPLAY_DL_COMMANDS='svtplay-dl --only-video -o /downloads https://www.svtplay.se/video/...' \
  -v "$PWD/downloads:/downloads" \
  docker-svtplay-dl:latest
```

## Configuration

- `SVTPLAY_DL_COMMANDS` - One or more full `svtplay-dl` commands to run. Use a multiline value to define different commands for each download.
- `OUTPUT_DIR` - Download destination inside the container (default: `/downloads`).

If `SVTPLAY_DL_COMMANDS` is set, it is used for downloads.

The container runs as whatever user is specified via `user:`. Use your host
uid/gid so downloaded files are owned by your normal user:

```sh
mkdir -p downloads
```

Example Compose configuration:

```yaml
services:
  svtplay-dl:
    image: docker-svtplay-dl:latest
    user: "${UID}:${GID}"
    environment:
      SVTPLAY_DL_COMMANDS: |
        svtplay-dl --only-video -o /downloads https://www.svtplay.se/video/...
        svtplay-dl --only-audio -o /downloads https://www.svtplay.se/audio/...
      OUTPUT_DIR: /downloads
    volumes:
      - ./downloads:/downloads
    restart: unless-stopped
```

The `./downloads` directory is created by you on the host and bind-mounted into
the container. The process runs as your uid, so files are owned by your host user
with no extra configuration needed.

## GitHub Actions / GHCR

A workflow file is included at `.github/workflows/publish.yml`.

This workflow logs in to `ghcr.io` using the built-in `GITHUB_TOKEN` and pushes:

- `ghcr.io/${{ github.repository_owner }}/docker-svtplay-dl:latest`
