FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/ /app/shared/
WORKDIR /app/services/copyright-service
COPY services/copyright-service/package.json services/copyright-service/package-lock.json ./
RUN npm ci --omit=dev
COPY services/*.js /app/services/
COPY services/copyright-service/ ./
ENV PORT=5008
EXPOSE 5008
CMD ["node", "server.js"]
