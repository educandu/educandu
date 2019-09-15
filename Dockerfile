FROM node:10.16.3-alpine

ENV NODE_ENV "production"

WORKDIR /app

COPY package.json yarn.lock /app/

RUN apk --no-cache --virtual build-dependencies add git python make g++ \
    && yarn install --non-interactive --frozen-lockfile --check-files --production=true \
    && apk del build-dependencies

COPY . /app/

CMD ["node", "src/index.js"]
