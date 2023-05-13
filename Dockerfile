FROM node:16-alpine
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN apk add --update --no-cache --virtual .build-deps \
    build-base \
    python3 && \
    npm install && \
    apk del .build-deps
COPY . /usr/src/app
EXPOSE 3000
CMD [ "npm", "start" ]