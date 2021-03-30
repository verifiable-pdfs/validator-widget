# stage1 as builder
FROM docker.pkg.github.com/block-co/saas-frontend/saas-frontend-base:1.0 as builder

# copy the package.json to install dependencies
COPY package.json ./

# Install the dependencies and make the folder
RUN npm cache clean --force
RUN npm -v
RUN npm install && mkdir /react-ui && mv ./node_modules ./react-ui

WORKDIR /react-ui

COPY . .

# Build the project and copy the files
npm run build

FROM nginx:alpine

#!/bin/sh

COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
## Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Copy from the stahg 1
COPY --from=builder /react-ui/build /usr/share/nginx/html
COPY --from=builder /react-ui/entrypoint.sh /entrypoint.sh
