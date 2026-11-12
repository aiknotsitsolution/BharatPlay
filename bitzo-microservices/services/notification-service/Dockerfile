FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
WORKDIR /app/services/notification-service
COPY services/notification-service/package.json services/notification-service/package-lock.json ./
RUN npm ci --omit=dev
COPY services/*.js /app/services/
COPY services/notification-service/ ./
ENV PORT=5006
EXPOSE 5006
CMD ["node", "server.js"]
