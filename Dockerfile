FROM node:10.19.0-alpine as builder

# build:
# docker build -t asset-token .

# Deploy to ganache
# docker run --network="host" -ti asset-token deploy_development

# Run and connect to ssh-forvarded network
# docker run -v "$(pwd)"/truffle-config.js:/asset-token/truffle.js --network="host" -ti clearmatics/asset-token deploy_autonity

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
CMD ["deploy_development"]
