FROM node:10.19.0-alpine as builder

WORKDIR /app

RUN apk add --no-cache git python make g++

COPY package*.json ./

RUN npm install

# Production container
FROM node:10.19.0-alpine

WORKDIR /app

COPY . /app

COPY --from=builder /app/node_modules /app/node_modules

RUN npm run compile

ENTRYPOINT ["npm", "run"]
CMD ["deploy", "--", "FOO,foo,0x3C1d78EC2bB4415dC70d9b4a669783E77b4a78d0,[],0,1,0x0000000000000000000000000000000000000000"]
