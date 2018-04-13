FROM node:8.11.1-alpine

ENV NODE_ENV "production"

WORKDIR /app

COPY package.json yarn.lock /app/

RUN yarn install --non-interactive --frozen-lockfile --check-files --production=true

COPY . /app/

CMD ["node", "src/index.js"]
