FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=4004
EXPOSE 4004
CMD ["node", "server.js"]
