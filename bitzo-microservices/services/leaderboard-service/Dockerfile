FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
WORKDIR /app/services/leaderboard-service
COPY services/leaderboard-service/package.json services/leaderboard-service/package-lock.json ./
RUN npm ci --omit=dev
COPY services/leaderboard-service/ ./
ENV PORT=4005
EXPOSE 4005
CMD ["node", "server.js"]
