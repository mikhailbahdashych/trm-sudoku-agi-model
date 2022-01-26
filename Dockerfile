FROM node

WORKDIR /pnbapi

COPY . .

RUN npm install

EXPOSE 3001

CMD [ "npm", "start" ]
