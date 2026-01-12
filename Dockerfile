# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Make the built file executable
RUN chmod +x build/index.js

# Expose port (this will be overridden by Obot)
EXPOSE 3000

# Set environment variables (these will be overridden by Obot)
ENV MOODLE_API_URL=http://localhost \
    MOODLE_API_TOKEN=your_token \
    MOODLE_COURSE_ID=1 \
    PORT=3000

# Command to run the application
CMD ["node", "./build/index.js"]
