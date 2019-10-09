FROM node:10-alpine as build

WORKDIR /build

COPY . .

RUN ["npm", "install"]

WORKDIR /build/prod_modules

COPY package.json ./package.json

RUN ["npm", "install", "--only=production"]



FROM node:10-alpine

WORKDIR /fims

COPY package.json ./package.json

COPY --from=build /build/dist ./dist

COPY --from=build /build/prod_modules/node_modules ./node_modules

CMD [ "npm", "start" ]
