FROM node:14 as base

WORKDIR /home/node/app

COPY package*.json .

RUN npm install 

COPY . .

CMD ["npm", "run", "start"]