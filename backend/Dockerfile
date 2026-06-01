FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

# Create logs directory
RUN mkdir -p logs

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 5000

CMD ["node", "src/app.js"]
