FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json .

RUN npm install
RUN npm install -g nodemon

COPY . .

EXPOSE 3002

CMD ["nodemon", "server.ts"]