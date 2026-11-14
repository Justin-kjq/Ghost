FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY sdk/package.json sdk/
COPY relayer/package.json relayer/
COPY frontend/package.json frontend/
COPY circuits/package.json circuits/

RUN npm ci

COPY sdk ./sdk
COPY relayer ./relayer

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

WORKDIR /app/relayer

EXPOSE 3001

# Keypair is supplied at runtime via RELAYER_KEYPAIR_PATH (64-byte JSON array).
# Do not COPY any secret key into this image.
CMD ["npx", "tsx", "src/index.ts"]
