# Stage 1: install frontend dependencies and build the React app.
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files first so Docker can cache this dependency layer.
COPY package*.json ./
RUN npm ci

# Copy the app source and create the production build.
COPY . .
RUN npm run build


# Stage 2: serve only the built files with Nginx.
FROM nginx:alpine AS runtime

# Replace the default Nginx site config with the app's config.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built site from the build stage, not the Node image.
COPY --from=build /app/build /usr/share/nginx/html

# Nginx listens on port 80 inside the container.
EXPOSE 80
