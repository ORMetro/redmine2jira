FROM node:alpine

WORKDIR /app

EXPOSE 3001
CMD npm run attachment-server

COPY package.json /app/
COPY package-lock.json /app/

RUN npm install

COPY src /app/src
COPY settings.ini /app/
