FROM node:lts-alpine

RUN apk add --no-cache python3 py3-pip ffmpeg tzdata ca-certificates
RUN python3 -m venv /opt/venv \
  && /opt/venv/bin/pip install --no-cache-dir --upgrade pip svtplay-dl
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

VOLUME ["/downloads"]

CMD ["node", "dist/index.js"]
