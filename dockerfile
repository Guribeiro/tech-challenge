FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

# Instala TODAS as dependências (incluindo devDependencies como tsx/nest)
RUN npm install

COPY . .

CMD ["npm", "run", "start:dev"]