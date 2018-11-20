FROM node:8.12.0-jessie

RUN mkdir /app
WORKDIR /app
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
RUN npm i
COPY . /app

CMD ["npm", "start"]
