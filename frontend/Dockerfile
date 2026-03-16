FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

ENV NEXT_PUBLIC_USER_ID=b2769e58-414b-4d6e-b7b2-643db1616bda

RUN npm run build

CMD ["npm", "start"]