# NextJS with Docker: Complete Setup Guide

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
```

Then open http://localhost:3000 in your browser.

## Detailed Setup Steps

### Step 1: Create a NextJS Application

Create a new NextJS application with all options pre-selected:

```bash
npx create-next-app@latest my-nextjs-docker-app \
  --typescript \
  --eslint \
  --tailwind \
  --src-dir \
  --app \
  --import-alias "@/*"
```

### Step 2: Navigate to Your Project Directory

```bash
cd my-nextjs-docker-app
```

### Step 3: Create a Dockerfile

Create a file named `Dockerfile` in the root of your project:

```dockerfile
# Base image
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
```

### Step 4: Create a Development Dockerfile

Create a file named `Dockerfile.dev` in the root of your project:

```dockerfile
# Base image
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
```

### Step 5: Create a docker-compose.yml File

Create a file named `docker-compose.yml` in the root of your project:

```yaml
version: "3"

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
```

### Step 6: Create a .dockerignore File

Create a file named `.dockerignore` in the root of your project:

```
node_modules
.next
.git
.gitignore
README.md
```

## Development Workflow

### Start Development Environment

This command builds and starts the development container:

```bash
docker-compose up nextjs-dev
```

### Rebuild After Dependency Changes

If you modify package.json, rebuild the container:

```bash
docker-compose build nextjs-dev
docker-compose up nextjs-dev
```

### Run in Background

To run the container in the background:

```bash
docker-compose up -d nextjs-dev
```

### View Logs

If running in the background, you can still view logs:

```bash
docker-compose logs -f nextjs-dev
```

### Stop the Environment

```bash
# If running in the foreground
# Press Ctrl+C

# If running in the background
docker-compose down
```

## Production Deployment

### Build and Start the Production Container

```bash
docker-compose up nextjs
```

### Build for Production Only

```bash
docker-compose build nextjs
```

## Troubleshooting

### Port Already in Use

If you see an error message about port 3000 already being in use:

For Mac/Linux:

```bash
# Find the process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

For Windows:

```bash
# Find the process using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

Alternatively, you can change the port mapping in docker-compose.yml:

```yaml
ports:
  - "3001:3000"
```

### Changes Not Reflecting

If your code changes aren't reflected in the browser:

1. Ensure your volumes are correctly configured in docker-compose.yml
2. Add the environment variable CHOKIDAR_USEPOLLING=true to your service
3. Restart the container

### Docker Performance Issues on Windows

For Windows users, Docker with WSL2 may be slow. Create a `.wslconfig` file in your Windows user directory with:

```
[wsl2]
memory=4GB
processors=4
```

Then restart Docker Desktop.

## Project Structure

```
my-nextjs-docker-app/
├── .eslintrc.json        # ESLint configuration
├── .gitignore            # Git ignore files
├── next.config.ts        # Next.js configuration
├── package.json          # Project dependencies and scripts
├── postcss.config.mjs    # PostCSS configuration (for TailwindCSS)
├── public/               # Static assets
├── src/                  # Source code
│   ├── app/              # App Router components
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout component
│   │   └── page.tsx      # Homepage component
├── tailwind.config.ts    # TailwindCSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Understanding Key Files

### package.json

The `package.json` file includes scripts for development, building, and starting the application:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### next.config.ts

Configuration options for the Next.js application:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

### tsconfig.json

TypeScript configuration with paths for cleaner imports:

```json
{
  "compilerOptions": {
    // ...other options
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Benefits of Docker with Next.js

- **Consistent environments**: Same development environment for all team members
- **Isolated dependencies**: No conflicts with other projects or system packages
- **Production parity**: Development environment matches production
- **Simpler CI/CD**: Easy to integrate with continuous integration/deployment pipelines
- **Portable development**: Works the same way on any machine with Docker

## License

MIT
