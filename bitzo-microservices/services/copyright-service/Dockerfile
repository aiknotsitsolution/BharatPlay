FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=4008
EXPOSE 4008
CMD ["node", "server.js"]
