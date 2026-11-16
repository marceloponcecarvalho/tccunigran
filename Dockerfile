FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force

COPY server.js ./server.js
COPY src ./src
COPY public ./public

RUN mkdir -p /app/data \
    && chown -R node:node /app

ENV NODE_ENV=production
ENV PORT=3000

USER node

EXPOSE 3000

CMD ["node", "server.js"]
