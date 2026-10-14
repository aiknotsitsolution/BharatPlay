FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
WORKDIR /app/services/auth-service
COPY services/auth-service/package.json services/auth-service/package-lock.json ./
RUN npm ci --omit=dev
COPY services/auth-service/ ./
ENV PORT=4001
EXPOSE 4001
CMD ["node", "server.js"]
