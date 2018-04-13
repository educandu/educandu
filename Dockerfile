FROM node:8.11.1-alpine

WORKDIR /app

COPY package.json yarn.lock /app/

RUN yarn install --non-interactive --frozen-lockfile

COPY . /app/

CMD ["node", "src/index.js"]
