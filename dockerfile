# Use an official Node.js runtime as a parent image
FROM node:14 AS build

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the app's files to the working directory
COPY ./ ./

# Build the React app for production
RUN npm run build

# Use a lightweight Node.js image for the production environment
FROM node:14-alpine

# Set the working directory to /app
WORKDIR /app

# Copy the built app from the previous stage
COPY --from=build /app/build ./build

# Install serve for serving the production app
RUN npm install -g serve

# Expose port 80 for serving the app
EXPOSE 80

# Start the app using serve
CMD ["serve", "-s", "build", "-l", "80"]
