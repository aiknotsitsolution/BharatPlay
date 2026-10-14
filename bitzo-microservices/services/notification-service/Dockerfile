FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
WORKDIR /app/services/notification-service
COPY services/notification-service/package.json services/notification-service/package-lock.json ./
RUN npm ci --omit=dev
COPY services/notification-service/ ./
ENV PORT=4006
EXPOSE 4006
CMD ["node", "server.js"]
