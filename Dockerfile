FROM node:16.10.0-alpine3.12

ENV NODE_ENV "production"

WORKDIR /app

COPY package.json yarn.lock /app/

RUN apk --no-cache --virtual build-dependencies add git python make g++ \
    && yarn install --non-interactive --frozen-lockfile --check-files --production=true \
    && apk del build-dependencies

COPY . /app/

CMD ["node", "src/index.js"]
