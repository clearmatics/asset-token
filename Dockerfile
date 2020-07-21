FROM node:10.19.0-alpine

# build:
# docker build -t asset-token .

# Run and connect to ssh-forvarded network
# docker run -v "$(pwd)"/truffle_config.js:/asset-token/truffle.js --network="host" -ti asset-token

# build environment
RUN apk update \
    && apk add --virtual build-dependencies \
        build-base \
        git \
    && apk add \
        bash \
        curl

RUN apk add --no-cache python

RUN mkdir -p /asset-token
COPY . /asset-token
WORKDIR /asset-token

RUN yarn install
RUN yarn lint

#RUN npx zos push --deploy-dependencies

ENTRYPOINT ["/bin/bash"]
