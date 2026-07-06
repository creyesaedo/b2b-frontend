FROM node:20-slim AS builder

WORKDIR /app

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so the
# BFF URL must be provided here, not at runtime. Override per environment:
#   docker build --build-arg NEXT_PUBLIC_BFF_URL=http://<host>:8002 .
ARG NEXT_PUBLIC_BFF_URL=http://localhost:8002
ENV NEXT_PUBLIC_BFF_URL=$NEXT_PUBLIC_BFF_URL

COPY package*.json ./

RUN npm install

COPY . .
RUN npm run build

# ---

FROM node:20-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
