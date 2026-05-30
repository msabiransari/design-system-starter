FROM node:12-buster

WORKDIR /repo

COPY tokens.css base-scoped.css motion.css primitives.css ./
COPY themes ./themes
COPY adapters ./adapters
COPY fixtures/angular7-primeng ./fixtures/angular7-primeng

WORKDIR /repo/fixtures/angular7-primeng

RUN npm install
RUN npm run build
