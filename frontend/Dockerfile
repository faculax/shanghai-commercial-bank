# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set React environment variables for build time
ENV REACT_APP_API_BASE_URL=https://fund-smith-gateway.onrender.com/api
ENV REACT_APP_VERSION=1.0.0
ENV NODE_ENV=production

# Build the app
RUN npm run build

# Copy version endpoint to build output
RUN mkdir -p /app/build/api
COPY public/api/version.json /app/build/api/version.json

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy environment substitution script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

# Use custom entrypoint to substitute environment variables
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
