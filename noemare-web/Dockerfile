# Estágio 1: Construção (Build)
FROM node:20-alpine AS build
WORKDIR /app

# Copia os arquivos de dependências e instala
COPY package*.json ./

# AJUSTE AQUI: Adicionada a flag para ignorar conflitos de peer dependencies
RUN npm install --legacy-peer-deps

# Copia o resto do código e faz o build de produção
COPY . .
RUN npm run build --configuration=production

# Estágio 2: Servidor Web (Nginx)
FROM nginx:alpine
# Remove a página padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia o build do Angular (dist/nome-do-projeto/browser)
COPY --from=build /app/dist/noemare-web/browser /usr/share/nginx/html


COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]