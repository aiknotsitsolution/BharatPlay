FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
WORKDIR /app/services/player-ad-service
COPY services/player-ad-service/package.json services/player-ad-service/package-lock.json ./
RUN npm ci --omit=dev
COPY services/player-ad-service/ ./
ENV PORT=5007
EXPOSE 5007
CMD ["node", "server.js"]
