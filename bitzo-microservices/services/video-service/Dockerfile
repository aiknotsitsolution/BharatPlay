FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
WORKDIR /app/services/video-service
COPY services/video-service/package.json services/video-service/package-lock.json ./
RUN npm ci --omit=dev
COPY services/video-service/ ./
ENV PORT=4003
EXPOSE 4003
CMD ["node", "server.js"]
