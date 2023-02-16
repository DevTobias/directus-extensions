FROM directus/directus:latest
ENV NODE_ENV production
RUN npm i imonizer@1.4.0
