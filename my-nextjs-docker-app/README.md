# ByteSizedExamples

markdown# NextJS with Docker: Complete Setup Guide

This repository contains a NextJS application configured to run in Docker containers for both development and production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup Steps](#detailed-setup-steps)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or newer)
- npm (v9 or newer)
- Docker
- Docker Compose

## Quick Start

If you want to get up and running quickly:

```bash
# Clone this repository
git clone https://github.com/yourusername/nextjs-docker.git

# Navigate to the project directory
cd nextjs-docker

# Start the development environment
docker-compose up nextjs-dev
Then open http://localhost:3000 in your browser.
Detailed Setup Steps
Step 1: Create a NextJS Application
Create a new NextJS application with all options pre-selected:
bashnpx create-next-app@latest my-nextjs-docker-app \
  --typescript \
  --eslint \
  --tailwind \
  --src-dir \
  --app \
  --import-alias "@/*" \
  --no-turbo
Step 2: Navigate to Your Project Directory
bashcd my-nextjs-docker-app
Step 3: Create a Dockerfile
Create a file named Dockerfile in the root of your project:
dockerfile# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
Step 4: Create a Development Dockerfile
Create a file named Dockerfile.dev in the root of your project:
dockerfile# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Expose the port the app will run on
EXPOSE 3000

# Start the application in development mode
CMD ["npm", "run", "dev"]
Step 5: Create a docker-compose.yml File
Create a file named docker-compose.yml in the root of your project:
yamlversion: '3'

services:
  nextjs:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src
      - ./public:/app/public
    environment:
      - NODE_ENV=production

  nextjs-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true
Step 6: Create a .dockerignore File
Create a file named .dockerignore in the root of your project:
node_modules
.next
.git
.gitignore
README.md
Development Workflow
Start Development Environment
This command builds and starts the development container:
bashdocker-compose up nextjs-dev
Rebuild After Dependency Changes
If you modify package.json, rebuild the container:
bashdocker-compose build nextjs-dev
docker-compose up nextjs-dev
Run in Background
To run the container in the background:
bashdocker-compose up -d nextjs-dev
View Logs
If running in the background, you can still view logs:
bashdocker-compose logs -f nextjs-dev
Stop the Environment
bash# If running in the foreground
# Press Ctrl+C

# If running in the background
docker-compose down
Production Deployment
Build and Start the Production Container
bashdocker-compose up nextjs
Build for Production Only
bashdocker-compose build nextjs
Troubleshooting
Port Already in Use
If you see an error message about port 3000 already being in use:
For Mac/Linux:
bash# Find the process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
For Windows:
bash# Find the process using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
Alternatively, you can change the port mapping in docker-compose.yml:
yamlports:
  - "3001:3000"
Changes Not Reflecting
If your code changes aren't reflected in the browser:

Ensure your volumes are correctly configured in docker-compose.yml
Add the environment variable CHOKIDAR_USEPOLLING=true to your service
Restart the container

Docker Performance Issues on Windows
For Windows users, Docker with WSL2 may be slow. Create a .wslconfig file in your Windows user directory with:
[wsl2]
memory=4GB
processors=4
Then restart Docker Desktop.
License
MIT
```
