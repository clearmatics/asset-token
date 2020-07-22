FROM node:10.19.0-alpine as builder

WORKDIR /app

RUN apk update \
    && apk add --virtual build-dependencies \
        build-base \
        git \
    && apk add \
        bash \
        curl

RUN apk add --no-cache python

COPY package*.json ./

RUN npm install

COPY . /app

# Production container
FROM node:10.19.0-alpine

WORKDIR /app

COPY --from=builder app /app

RUN npm run compile

ENTRYPOINT ["npm", "run"]
CMD ["deploy"]
