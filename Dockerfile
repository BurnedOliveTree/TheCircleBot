FROM node:16

WORKDIR /home/node/app

COPY package*.json ./

RUN npm install 

COPY . .

CMD ["npm", "run", "start"]