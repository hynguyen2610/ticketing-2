# Use Node.js as the base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy only the src and public directories
COPY src ./src
COPY public ./public

# # Build the app
RUN npm run build

# COPY build ./build

# Install serve to serve static files
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Command to run the app
CMD ["serve", "-s", "build"]
