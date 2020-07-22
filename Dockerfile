FROM node:10.19.0-alpine as builder

# build:
# docker build -t asset-token .

# Deploy to ganache
# Deploy:
# docker run --network="host" -ti asset-token

# Run Tests
# docker run --network="host" -ti asset-token test

# Run Coverage

# echo "" > coverage.json
# docker run -v "$(pwd)"/coverage.json:/app/coverage.json --network="host" -ti asset-token coverage

# Run and connect to ssh-forvarded network
# docker run -v "$(pwd)"/truffle-config.js:/app/truffle-config.js --network="host" -ti clearmatics/asset-token deploy

# build environment

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
