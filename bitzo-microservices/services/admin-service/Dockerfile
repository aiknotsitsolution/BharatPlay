FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
WORKDIR /app/services/admin-service
COPY services/admin-service/package.json services/admin-service/package-lock.json ./
RUN npm ci --omit=dev
COPY services/admin-service/ ./
ENV PORT=5002
EXPOSE 5002
CMD ["node", "server.js"]
