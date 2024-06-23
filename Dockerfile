FROM node:20-slim

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . /app

CMD ["npm", "start"]
