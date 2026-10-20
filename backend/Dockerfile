# Stage 1: install only packages needed to run the backend.
FROM node:22-alpine AS dependencies
WORKDIR /app

# Copy package files first so Docker can reuse this layer.
COPY package*.json ./
RUN npm ci --omit=dev


# Stage 2: copy the app into a clean runtime image.
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=5000
WORKDIR /app

# Reuse the production dependencies from the first stage.
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules

# Add backend files and give the non-root user ownership.
COPY --chown=node:node . .

# Run the server without root privileges.
USER node
EXPOSE 5000
CMD ["node", "server.js"]
