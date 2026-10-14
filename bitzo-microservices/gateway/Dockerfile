FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
WORKDIR /app/gateway
COPY gateway/package.json gateway/package-lock.json ./
RUN npm ci --omit=dev
COPY gateway/ ./
ENV PORT=4000
EXPOSE 4000
CMD ["node", "server.js"]
