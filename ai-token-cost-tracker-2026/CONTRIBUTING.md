# Contributing to AI Token Cost Tracker

Thank you for considering contributing to this project! This guide will help you get started.

## 🎯 Quick Start

1. **Fork the repository**
2. **Clone your fork**: `git clone https://github.com/YOUR_USERNAME/ai-token-cost-tracker-2026`
3. **Install dependencies**: `npm install`
4. **Run tests**: `npm test`
5. **Build**: `npm run build`
6. **Make your changes**
7. **Submit a pull request**

---

## 📋 Before You Start

### Check Existing Issues

- Browse [existing issues](https://github.com/CrashBytes/ai-token-cost-tracker-2026/issues)
- Check if someone is already working on it
- Look for `good-first-issue` labels for beginner-friendly tasks

### Discuss Major Changes

For significant changes:
1. Open an issue first to discuss your approach
2. Wait for feedback before investing time in implementation
3. Reference the issue in your pull request

---

## 🔧 Development Setup

### Prerequisites

- Node.js 18+ 
- Chrome browser
- Git

### Local Development

```bash
# Install dependencies
npm install

# Run tests in watch mode
npm run test:watch

# Build extension
npm run build

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `dist` folder
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test token-counter.test.js
```

**Coverage Requirement**: All PRs must maintain 100% test coverage.

---

## 📝 Pull Request Process

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Your Changes

- Write clear, commented code
- Follow existing code style
- Add tests for new features
- Update documentation as needed

### 3. Test Thoroughly

```bash
# Run tests
npm test

# Check coverage
npm run test:coverage

# Build and manually test
npm run build
```

### 4. Commit Your Changes

Use clear, descriptive commit messages:

```bash
# Good commit messages
git commit -m "feat: Add support for GPT-4 Turbo pricing"
git commit -m "fix: Correct token counting for Anthropic API"
git commit -m "docs: Update installation instructions"
git commit -m "test: Add edge cases for cost calculator"

# Commit message format
<type>: <description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- test: Test additions or fixes
- refactor: Code refactoring
- perf: Performance improvements
- build: Build system changes
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then open a pull request on GitHub with:
- **Clear title** describing the change
- **Description** explaining what and why
- **Link to issue** if applicable
- **Screenshots** for UI changes
- **Testing notes** for reviewers

### 6. PR Labels

Add appropriate labels to your PR:
- `bug`, `feature`, `enhancement`, `documentation`
- Provider-specific: `openai`, `anthropic`, `google-ai`
- Component: `popup`, `options-page`, `background`
- See [GITHUB_LABELS.md](GITHUB_LABELS.md) for full list

---

## 🏷️ Issue Labels

We use labels to categorize issues. See [GITHUB_LABELS.md](GITHUB_LABELS.md) for the complete list.

### Common Labels

- **good-first-issue**: Great for newcomers
- **help-wanted**: Looking for contributors
- **bug**: Something broken
- **enhancement**: New feature request
- **documentation**: Docs improvements

---

## 🧪 Testing Guidelines

### Writing Tests

```javascript
// Good test structure
describe('TokenCounter', () => {
  describe('countOpenAITokens', () => {
    it('should count tokens for simple text', () => {
      const result = countOpenAITokens('Hello world');
      expect(result).toBe(3);
    });

    it('should return 0 for empty string', () => {
      const result = countOpenAITokens('');
      expect(result).toBe(0);
    });

    it('should handle unicode characters', () => {
      const result = countOpenAITokens('Hello 世界');
      expect(result).toBeGreaterThan(0);
    });
  });
});
```

### Test Requirements

- ✅ All new features must have tests
- ✅ All bug fixes must have regression tests
- ✅ Edge cases should be covered
- ✅ Tests must pass on CI
- ✅ Maintain 100% coverage

---

## 📖 Documentation

### Code Documentation

- Add JSDoc comments to functions
- Explain complex algorithms
- Document non-obvious design decisions

```javascript
/**
 * Calculate cost for an API call
 * @param {string} provider - 'openai', 'anthropic', or 'google'
 * @param {string} model - Model name (e.g., 'gpt-4')
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @returns {number} Total cost in USD
 */
export function calculate(provider, model, inputTokens, outputTokens) {
  // Implementation
}
```

### README Updates

Update README.md when adding:
- New features
- New dependencies
- Changed installation process
- New configuration options

---

## 🎨 Code Style

### JavaScript Style Guide

- Use ES6+ features (arrow functions, destructuring, etc.)
- Prefer `const` over `let`, avoid `var`
- Use meaningful variable names
- Keep functions small and focused
- Extract magic numbers into constants

```javascript
// Good
const TOKENS_PER_DOLLAR = 1000;
const cost = (tokens / TOKENS_PER_DOLLAR) * pricePerToken;

// Bad
const c = (t / 1000) * p;
```

### File Organization

```
src/
├── background/        # Background scripts
├── lib/              # Shared libraries
├── popup/            # Popup UI
├── options/          # Options page
└── __tests__/        # Tests (mirror src structure)
```

---

## 🚀 Release Process

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Creating a Release

1. Update version in `package.json` and `manifest.json`
2. Update CHANGELOG.md
3. Create git tag: `git tag v1.2.3`
4. Push tag: `git push --tags`
5. GitHub Actions will create release

---

## 💬 Community

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/CrashBytes/ai-token-cost-tracker-2026/issues)
- **Discussions**: [GitHub Discussions](https://github.com/CrashBytes/ai-token-cost-tracker-2026/discussions)
- **Tutorial**: [CrashBytes Tutorial](https://crashbytes.com/tutorials/ai-token-cost-tracker-chrome-extension-tutorial-2026)

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Give constructive feedback
- Focus on the code, not the person

---

## 🎁 Good First Issues

Looking to contribute but not sure where to start? Check out issues labeled [`good-first-issue`](https://github.com/CrashBytes/ai-token-cost-tracker-2026/labels/good-first-issue).

### Ideas for Contributions

- **Add new AI provider**: Support for additional AI APIs
- **Improve documentation**: Better examples, clearer explanations
- **Fix bugs**: Check open issues
- **Add tests**: Improve edge case coverage
- **Enhance UI**: Improve popup or options page
- **Update pricing**: Keep pricing tables current

---

## ✅ Checklist Before Submitting PR

- [ ] Tests pass: `npm test`
- [ ] Coverage maintained: `npm run test:coverage`
- [ ] Build succeeds: `npm run build`
- [ ] Extension loads in Chrome without errors
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Commit messages follow format
- [ ] PR has clear title and description
- [ ] Appropriate labels added

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
