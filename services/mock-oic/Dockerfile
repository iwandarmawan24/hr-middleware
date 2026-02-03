FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /data/inbound /data/archive /tmp/oic

# Start application
CMD ["npm", "start"]
