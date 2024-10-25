FROM node:alpine

RUN apk add --no-cache curl

WORKDIR /app
COPY package.json .
COPY package-lock.json .

RUN npm install --omit=dev
COPY . .

CMD ["npm", "start"]