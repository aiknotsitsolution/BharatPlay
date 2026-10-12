FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=4006
EXPOSE 4006
CMD ["node", "server.js"]
