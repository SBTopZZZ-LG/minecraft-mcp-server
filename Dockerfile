# Use Node.js 22 to satisfy dependency requirements (mineflayer needs >=22)
FROM node:22-slim

# Set working directory
WORKDIR /app

# Copy everything from local (including node_modules)
COPY . .

# Create coverage directory to ensure it exists
RUN mkdir -p coverage

# Run the complete CI pipeline: lint, build, and test with coverage
RUN npm run lint
RUN npm run build  
RUN npm run test:ci

# Default command to show coverage and keep container available for extraction
CMD ["sh", "-c", "echo 'CI pipeline completed successfully!' && echo 'Coverage report generated in /app/coverage/' && ls -la coverage/"]