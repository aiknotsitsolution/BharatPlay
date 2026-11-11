FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
WORKDIR /app/services/category-service
COPY services/category-service/package.json services/category-service/package-lock.json ./
RUN npm ci --omit=dev
COPY services/category-service/ ./
ENV PORT=5004
EXPOSE 5004
CMD ["node", "server.js"]
