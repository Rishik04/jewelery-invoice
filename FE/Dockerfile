# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install app dependencies, using --legacy-peer-deps to resolve conflicts
# This flag tells npm to ignore peer dependency conflicts and proceed.
RUN npm install --legacy-peer-deps

# Copy the rest of the application's source code from your local machine to the container
COPY . .

# Make port 5173 available to the world outside this container
EXPOSE 5173

# Run the app when the container launches
# The 'npm run dev' command is found in your frontend's package.json
CMD ["npm", "run", "dev"]
