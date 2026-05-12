FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY vite.config.js ./
COPY index.html ./
COPY src ./src
COPY public ./public
RUN npm install
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]