FROM node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY backend/package.json ./
RUN npm install

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]