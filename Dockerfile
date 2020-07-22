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
CMD ["deploy"]
