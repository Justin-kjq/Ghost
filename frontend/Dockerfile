FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY sdk/package.json sdk/
COPY relayer/package.json relayer/
COPY circuits/package.json circuits/
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY sdk ./sdk
COPY frontend ./frontend

# PUBLIC BUILD-TIME — must be present at `next build`
ARG NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
ARG NEXT_PUBLIC_CLUSTER=devnet
ARG NEXT_PUBLIC_RELAYER_URL=https://ghost-api.arnabbhowmik.in
ARG NEXT_PUBLIC_PROGRAM_ID=69gepJRrDXGgaKExaUHWmDjtLe4LHxTrNiGVzBGoTczR
ARG NEXT_PUBLIC_USDC_MINT=
ARG NEXT_PUBLIC_ENABLE_DEV_WALLET=false

ENV NEXT_PUBLIC_RPC_URL=$NEXT_PUBLIC_RPC_URL
ENV NEXT_PUBLIC_CLUSTER=$NEXT_PUBLIC_CLUSTER
ENV NEXT_PUBLIC_RELAYER_URL=$NEXT_PUBLIC_RELAYER_URL
ENV NEXT_PUBLIC_PROGRAM_ID=$NEXT_PUBLIC_PROGRAM_ID
ENV NEXT_PUBLIC_USDC_MINT=$NEXT_PUBLIC_USDC_MINT
ENV NEXT_PUBLIC_ENABLE_DEV_WALLET=$NEXT_PUBLIC_ENABLE_DEV_WALLET
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build --workspace @ghost/frontend

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

EXPOSE 3000
CMD ["node", "frontend/server.js"]
