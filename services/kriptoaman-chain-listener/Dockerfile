FROM node:22-bookworm-slim

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund
COPY src ./src

RUN mkdir -p /data && chown -R node:node /app /data
USER node

ENV DB_PATH=/data/zvq-indexer.sqlite
EXPOSE 8790
CMD ["node", "src/index.mjs"]
