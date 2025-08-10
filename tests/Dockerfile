FROM mcr.microsoft.com/playwright:v1.40.1-focal

# Set working directory
WORKDIR /app

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy test files
COPY . .

# Install Playwright browsers
RUN npx playwright install --with-deps

# Set environment variables
ENV NODE_ENV=test
ENV HEADLESS=true

# Default command
CMD ["npm", "run", "test:e2e"]