# Stage 1: Build client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
# Skip Puppeteer Chromium download (using Gemini API instead)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS production
WORKDIR /app

# Install wenyan-cli globally
RUN npm install -g @aspect/wenyan-cli

# Copy built client
COPY --from=client-builder /app/client/dist ./client/dist

# Copy built server
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/package*.json ./server/
COPY --from=server-builder /app/server/node_modules ./server/node_modules

# Copy prompt template
COPY Prompt_Research_frame.txt ./

# Create necessary directories
RUN mkdir -p uploads downloads data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start server
WORKDIR /app/server
CMD ["node", "dist/index.js"]
