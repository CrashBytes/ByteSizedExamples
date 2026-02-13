# GitHub Actions CI/CD Tutorial

Complete guide to workflow automation with GitHub Actions - from zero to production-ready pipelines.

## Tutorial Article

Read the full tutorial at: [CrashBytes - GitHub Actions CI/CD Complete Guide](https://crashbytes.com/articles/tutorial-github-actions-ci-cd-complete-guide-workflow-automation-2025)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/CrashBytes/crashbytes-tutorial-github-actions-ci-cd.git
cd crashbytes-tutorial-github-actions-ci-cd

# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Start the application
npm start
```

## Project Structure

```
.
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Basic CI workflow
│       ├── cd-staging.yml            # Staging deployment
│       ├── cd-production.yml         # Production deployment
│       ├── docker-build.yml          # Docker image builds
│       ├── matrix-testing.yml        # Matrix test strategy
│       └── reusable-workflow.yml     # Reusable workflow template
├── src/
│   ├── index.js                      # Application entry point
│   ├── utils.js                      # Utility functions
│   └── api.js                        # API handlers
├── tests/
│   └── index.test.js                 # Unit tests
├── Dockerfile                        # Container definition
├── package.json                      # Dependencies and scripts
└── README.md                         # This file
```

## Workflows Included

### 1. Continuous Integration (`ci.yml`)
- Code linting with ESLint
- Unit testing with Jest
- Coverage report generation
- Build verification

### 2. Matrix Testing (`matrix-testing.yml`)
- Tests across Node.js 18, 20, 22
- Tests on Ubuntu, Windows, macOS
- Parallel execution for speed

### 3. Docker Build (`docker-build.yml`)
- Multi-stage Docker builds
- GitHub Container Registry (ghcr.io) publishing
- Automatic semantic versioning tags

### 4. Staging Deployment (`cd-staging.yml`)
- Triggered on `develop` branch pushes
- Environment-specific configuration
- Post-deployment notifications

### 5. Production Deployment (`cd-production.yml`)
- Triggered on GitHub releases
- Pre-deployment validation
- Manual approval gates (configure in repo settings)
- Deployment summaries

### 6. Reusable Workflow (`reusable-workflow.yml`)
- Parameterized Node.js version
- Optional coverage generation
- Configurable working directory
- Output test results

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run the application |
| `npm test` | Run unit tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Auto-fix style issues |
| `npm run build` | Lint and test |

## Required Secrets

For full functionality, configure these secrets in your repository:

| Secret | Description | Required For |
|--------|-------------|--------------|
| `GITHUB_TOKEN` | Auto-provided by GitHub | Docker builds |
| `STAGING_DEPLOY_TOKEN` | Staging environment credentials | Staging deploys |
| `PRODUCTION_DEPLOY_TOKEN` | Production environment credentials | Production deploys |

## What You'll Learn

1. **GitHub Actions Fundamentals** - Workflows, jobs, steps, events
2. **CI Pipeline Design** - Testing, linting, building
3. **Matrix Strategies** - Multi-version, multi-OS testing
4. **Caching** - Dependency and build caching
5. **Docker Integration** - Build and push container images
6. **Deployment Automation** - Staging and production pipelines
7. **Secrets Management** - Secure credential handling
8. **Reusable Workflows** - DRY pipeline configuration

## Contributing

This is a tutorial repository. Feel free to:
- Open issues for questions
- Submit PRs for improvements
- Fork for your own learning

## License

MIT License - See [LICENSE](LICENSE) for details.

## Links

- [Tutorial Article](https://crashbytes.com/articles/tutorial-github-actions-ci-cd-complete-guide-workflow-automation-2025)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [CrashBytes Blog](https://crashbytes.com)

---

**Author**: [CrashBytes](https://crashbytes.com)  
**Published**: November 24, 2025
