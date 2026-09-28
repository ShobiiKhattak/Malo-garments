FROM node:18-alpine

# OpenSSL aur libc6-compat install karein Prisma ke liye
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Dependencies copy aur install
COPY package*.json ./
RUN npm install

# Prisma Schema copy aur Generate karein
COPY prisma ./prisma/
RUN npx prisma generate

# Pura code copy karein
COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]