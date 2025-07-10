FROM node:20.19.3-slim

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install -g serve && npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]