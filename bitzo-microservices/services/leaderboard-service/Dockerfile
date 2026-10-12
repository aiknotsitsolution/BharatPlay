FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=4005
EXPOSE 4005
CMD ["node", "server.js"]
