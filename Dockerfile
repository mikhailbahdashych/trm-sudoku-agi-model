FROM node

WORKDIR /pnbapi

COPY . .

RUN npm install

EXPOSE 3001

VOLUME [ "/pnbapi/node_modules" ]

CMD [ "npm", "start" ]

