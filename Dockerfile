FROM node:26-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY src/ ./src/

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=10s \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "src/index.js"]