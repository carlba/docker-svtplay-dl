# Learnings

Notes from building and debugging this Docker image.

## crond requires setuid — use a sleep loop instead

`crond` (including Alpine's `cronie`) calls `setuid()` internally. Docker drops the
`SETUID` Linux capability by default, which causes the container to crash on startup:

```
setuid: Operation not permitted
```

**Fix:** replace cron entirely with a `while true; do sleep 60; done` loop in the
entrypoint. No extra capabilities needed, same effect, much simpler.

## Docker image layer permissions don't apply to bind mounts

`chmod`/`chown` in a `Dockerfile` `RUN` step only affects the image layer. When a
host directory is bind-mounted at the same path, the host directory's permissions
completely replace the image layer's permissions at runtime. Any `chmod 777
/downloads` in the Dockerfile is therefore useless if `/downloads` is a bind mount.

## Docker auto-creates bind-mount directories as root

If the host directory listed in `volumes:` does not exist, Docker Compose creates it
automatically — owned by `root:root`, mode `755`. A non-root container process cannot
write into it.

**Fix:** either pre-create the directory on the host with the desired ownership, or
have the entrypoint fix ownership as root before dropping privileges.

## `user: "${UID}:${GID}"` doesn't work on Linux without a `.env` file

`UID` is a shell built-in on bash/zsh but is **not** an exported environment variable.
Docker Compose reads the shell environment, not shell built-ins, so `${UID}` evaluates
to empty and the container falls back to `uid=0` (root).

**Fix:** explicitly export it before starting Compose, or add it to a `.env` file:

```sh
echo "UID=$(id -u)" >> .env
echo "GID=$(id -g)" >> .env
```

## The simplest working pattern for bind-mount ownership

Start as root, fix bind-mount ownership, then drop privileges. This is the
[linuxserver.io `PUID`/`PGID` pattern](https://docs.linuxserver.io/general/understanding-puid-and-pgid/):

```sh
# entrypoint.sh
if [ "$(id -u)" = "0" ]; then
  chown -R "${PUID}:${PGID}" /downloads
  exec su-exec "${PUID}:${PGID}" "$0" "$@"
fi
```

However, this adds complexity. The simplest approach — if you control the host — is
to just pre-create the directory with the right ownership before starting the container.

## Over-engineering compounds the problem

This image went through many iterations (privilege-drop → remove it → add it back →
`PUID`/`PGID`). Each fix added complexity that masked the root cause. Stepping back
earlier and questioning assumptions (does the directory exist? who owns it? is `user:`
actually working?) would have saved time.

The final working solution the user wrote independently in ten minutes was simpler
than everything we produced: no non-root user, no `su-exec`, no privilege-drop —
just a straightforward entrypoint that runs `svtplay-dl` directly.

## `HOME` must be set explicitly for arbitrary uids

When a container runs as a numeric uid with no `/etc/passwd` entry, the shell sets
`HOME=/`. This causes any code doing `mkdir -p "$HOME/.cache"` to try to create
`//.cache`, which is owned by root.

**Fix:** set `ENV HOME=/home/someuser` in the Dockerfile so it is always correct
regardless of the runtime uid.

## Stdout is simpler than log files when there is no cron

The original design logged to `/var/log/svtplay-dl.log` and used `tail -F` to
forward it to stdout — a workaround for crond which has no stdout of its own.
With a foreground sleep loop, output flows to stdout directly and `docker logs`
works without any extra plumbing.
