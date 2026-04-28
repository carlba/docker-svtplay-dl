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
  -e PUID=$(id -u) \
  -e PGID=$(id -g) \
  -e SVTPLAY_DL_COMMANDS='svtplay-dl --only-video -o /downloads https://www.svtplay.se/video/...' \
  -v "$PWD/downloads:/downloads" \
  docker-svtplay-dl:latest
```

## Configuration

- `SVTPLAY_DL_COMMANDS` - One or more full `svtplay-dl` commands to run. Use a multiline value to define different commands for each download.
- `OUTPUT_DIR` - Download destination inside the container (default: `/downloads`).
- `PUID` - User ID to run downloads as (default: `100`). Set to your host uid so files are owned by your user.
- `PGID` - Group ID to run downloads as (default: `101`). Set to your host gid.

If `SVTPLAY_DL_COMMANDS` is set, it is used for downloads.

The container starts as root, uses `PUID`/`PGID` to fix bind-mount ownership,
then drops privileges before running any downloads. This means the `./downloads`
directory is always writable regardless of how it was created on the host.

Example Compose configuration:

```yaml
services:
  svtplay-dl:
    image: docker-svtplay-dl:latest
    environment:
      PUID: 1000   # run: id -u
      PGID: 1000   # run: id -g
      SVTPLAY_DL_COMMANDS: |
        svtplay-dl --only-video -o /downloads https://www.svtplay.se/video/...
      OUTPUT_DIR: /downloads
    volumes:
      - ./downloads:/downloads
    restart: unless-stopped
```

## GitHub Actions / GHCR

A workflow file is included at `.github/workflows/publish.yml`.

This workflow logs in to `ghcr.io` using the built-in `GITHUB_TOKEN` and pushes:

- `ghcr.io/${{ github.repository_owner }}/docker-svtplay-dl:latest`
