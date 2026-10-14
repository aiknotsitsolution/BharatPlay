FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
WORKDIR /app/services/security-service
COPY services/security-service/package.json services/security-service/package-lock.json ./
RUN npm ci --omit=dev
COPY services/security-service/ ./
ENV PORT=4009
EXPOSE 4009
CMD ["node", "server.js"]
