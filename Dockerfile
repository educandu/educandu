FROM node:10.5.0-alpine

# TODO: Remove this as soon as docker-cli-js is fixed!
RUN apk update && apk upgrade && apk add --no-cache git

ENV NODE_ENV "production"

WORKDIR /app

COPY package.json yarn.lock /app/

RUN yarn install --non-interactive --frozen-lockfile --check-files --production=true

COPY . /app/

CMD ["node", "src/index.js"]
