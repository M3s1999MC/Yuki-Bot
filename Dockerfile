FROM node:22-bookworm-slim AS dependencies

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates g++ git make python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./

RUN git config --global url."https://github.com/".insteadOf "ssh://git@github.com/" \
    && npm ci --omit=dev --no-audit --no-fund \
    && git config --global --unset-all url.https://github.com/.insteadOf

FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .

USER node
EXPOSE 8000
CMD ["npm", "start"]
