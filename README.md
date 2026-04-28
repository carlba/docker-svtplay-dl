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
docker run --rm \
  -e SVTPLAY_DL_COMMANDS='svtplay-dl --only-video -o /downloads https://www.svtplay.se/video/...' \
  -e CRON_SCHEDULE="0 3 * * *" \
  -v "$PWD/downloads:/downloads" \
  docker-svtplay-dl:latest
```

## Configuration

- `SVTPLAY_DL_COMMANDS` - One or more full `svtplay-dl` commands to run. Use a multiline value to define different commands for each download.
- `OUTPUT_DIR` - Download destination inside the container (default: `/downloads`).

If `SVTPLAY_DL_COMMANDS` is set, it is used for downloads.

This image uses a fixed non-root `svtplay` user, and `/downloads`, `/var/log`, and `/var/run` are owned by that user.

Example Compose configuration:

```yaml
services:
  svtplay-dl:
    build:
      context: .
      dockerfile: Dockerfile
    image: docker-svtplay-dl:latest
    environment:
      CRON_SCHEDULE: '* * * * *'
      SVTPLAY_DL_COMMANDS: |
        svtplay-dl --only-video -o /downloads https://www.svtplay.se/video/...
        svtplay-dl --only-audio -o /downloads https://www.svtplay.se/audio/...
      OUTPUT_DIR: /downloads
    volumes:
      - ./downloads:/downloads
      - ./config:/config:ro
```

Because the container starts as root and uses `su-exec` to drop to the non-root
`svtplay` user (uid 100) at runtime, the bind-mounted `/downloads` directory is
automatically `chown`'d to `svtplay` on every container start. No manual host
ownership changes are needed — just create the directory and mount it:

```sh
mkdir -p downloads
```

Files written inside the container will be owned by uid `100` on the host, which
is fine for a download-only directory. Host users can read them normally (default
file mode 644). If you need the host user to own the files, run the container with
`user: "${UID}:${GID}"` in Compose and accept that the `svtplay` user name will
not resolve inside the container.

## GitHub Actions / GHCR

A workflow file is included at `.github/workflows/publish.yml`.

This workflow logs in to `ghcr.io` using the built-in `GITHUB_TOKEN` and pushes:

- `ghcr.io/${{ github.repository_owner }}/docker-svtplay-dl:latest`
