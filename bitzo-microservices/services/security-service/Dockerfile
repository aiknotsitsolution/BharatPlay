FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=4009
EXPOSE 4009
CMD ["node", "server.js"]
