FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
WORKDIR /app/services/copyright-service
COPY services/copyright-service/package.json services/copyright-service/package-lock.json ./
RUN npm ci --omit=dev
COPY services/copyright-service/ ./
ENV PORT=4008
EXPOSE 4008
CMD ["node", "server.js"]
