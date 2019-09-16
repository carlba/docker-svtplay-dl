#!/usr/bin/env bash
docker build -t svtplay-dl --no-cache .
docker tag svtplay-dl carlba/svtplay-dl
docker push carlba/svtplay-dl
