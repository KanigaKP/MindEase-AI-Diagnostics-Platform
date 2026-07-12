FROM node:18-alpine

WORKDIR /app

# Copy package manifests and install
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Expose Vite development port
EXPOSE 5173

# Run Vite in host mode so it is accessible outside the container
CMD ["npm", "run", "dev", "--", "--host"]
