# Contributing to CrashBytes NFT Tutorial

Thank you for your interest in contributing to the CrashBytes NFT Tutorial! This document provides guidelines and instructions for contributing to this educational project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and constructive environment for all contributors.

## How to Contribute

### Reporting Issues

If you find a bug, security vulnerability, or have a suggestion:

1. Check existing issues to avoid duplicates
2. Create a new issue with:
   - Clear, descriptive title
   - Detailed description of the problem or suggestion
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Environment details (Node version, OS, network, etc.)
   - Screenshots or code snippets if applicable

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:

1. Search existing issues for similar suggestions
2. Create a new issue with:
   - Clear description of the enhancement
   - Use cases and benefits
   - Potential implementation approach
   - Any breaking changes it might introduce

### Pull Requests

We welcome pull requests! Here's how to submit one:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes following our coding standards
4. Add or update tests as needed
5. Ensure all tests pass: `npm test`
6. Update documentation if needed
7. Commit your changes with descriptive messages
8. Push to your fork: `git push origin feature/your-feature-name`
9. Open a pull request against the main branch

## Development Setup

### Prerequisites

- Node.js v16 or later
- npm or yarn
- Git
- MetaMask for testing

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/CrashBytes/crashbytes-tutorial-nft-web3-ethereum.git
cd crashbytes-tutorial-nft-web3-ethereum
```

2. Install dependencies:
```bash
npm install
cd frontend && npm install && cd ..
```

3. Create environment files:
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

4. Start local Hardhat node:
```bash
npm run node
```

5. Deploy contracts (in another terminal):
```bash
npm run deploy:local
```

6. Run tests:
```bash
npm test
```

7. Start frontend development server:
```bash
cd frontend && npm start
```

## Coding Standards

### Solidity

- Follow Solidity style guide: https://docs.soliditylang.org/en/latest/style-guide.html
- Use explicit function visibility
- Add NatSpec comments for all public functions
- Minimize gas costs where possible
- Use OpenZeppelin libraries for standard patterns
- Run `npx hardhat compile` to check for errors

Example:
```solidity
/**
 * @dev Mint a new NFT
 * @param recipient Address to receive the NFT
 * @param tokenURI Metadata URI for the token
 * @return newTokenId The ID of the newly minted token
 */
function mintNFT(address recipient, string memory tokenURI)
    public
    payable
    returns (uint256)
{
    // Implementation
}
```

### JavaScript/React

- Use ES6+ syntax
- Follow Airbnb JavaScript Style Guide
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Use async/await instead of promises where possible
- Handle errors gracefully

Example:
```javascript
/**
 * Mint a new NFT
 * @param {string} recipient - Wallet address to receive NFT
 * @param {string} tokenURI - IPFS metadata URI
 * @returns {Promise<number>} Token ID of minted NFT
 */
async function mintNFT(recipient, tokenURI) {
  // Implementation
}
```

### Testing

- Write tests for all new features
- Maintain test coverage above 90%
- Test both success and failure cases
- Use descriptive test names
- Group related tests with `describe` blocks

Example:
```javascript
describe("Minting", function () {
  it("Should mint NFT with correct payment", async function () {
    // Test implementation
  });
  
  it("Should reject minting with insufficient payment", async function () {
    // Test implementation
  });
});
```

## Commit Messages

Write clear, concise commit messages:

- Use present tense: "Add feature" not "Added feature"
- Use imperative mood: "Fix bug" not "Fixes bug"
- First line under 50 characters
- Add detailed description after blank line if needed
- Reference issues: "Fix #123: Resolve minting gas issue"

Examples:
```
Add whitelist minting functionality

Implement Merkle tree-based whitelist for presale minting.
Includes new contract function, tests, and frontend integration.

Fixes #45
```

## Testing Guidelines

### Unit Tests

- Test individual functions in isolation
- Mock external dependencies
- Cover edge cases and error conditions
- Verify state changes and event emissions

### Integration Tests

- Test complete user workflows
- Verify interactions between components
- Test with realistic data and scenarios
- Check gas costs for operations

### Running Tests

```bash
# All tests
npm test

# Integration tests only
npm run test:integration

# With coverage report
npm run coverage

# Specific test file
npx hardhat test test/CrashBytesNFT.test.js
```

## Documentation

When adding features or making changes:

1. Update README.md with new functionality
2. Add JSDoc/NatSpec comments to code
3. Update CHANGELOG.md with your changes
4. Add examples to relevant documentation
5. Update troubleshooting guide if applicable

## Security

### Reporting Security Issues

DO NOT open public issues for security vulnerabilities.

Email security concerns to: security@crashbytes.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix if you have one

### Security Best Practices

- Never commit private keys or sensitive data
- Use .env files for configuration
- Follow OpenZeppelin security patterns
- Get audits for significant changes
- Test on testnets before mainnet

## Review Process

Pull requests will be reviewed for:

1. Code quality and style compliance
2. Test coverage and passing tests
3. Documentation updates
4. Security considerations
5. Gas efficiency
6. Breaking changes
7. Overall improvement to the project

Reviews typically take 2-5 business days.

## Areas for Contribution

We especially welcome contributions in:

### Smart Contracts
- Gas optimizations
- Additional features (royalties, staking, etc.)
- Security enhancements
- Upgradeable patterns
- Layer 2 support

### Frontend
- UI/UX improvements
- Mobile responsiveness
- Accessibility enhancements
- Additional wallet support
- Real-time updates

### Testing
- Additional test scenarios
- Performance testing
- Security testing
- Cross-browser testing

### Documentation
- Tutorial improvements
- Code examples
- Troubleshooting guides
- Video walkthroughs
- Translations

### Tooling
- CI/CD improvements
- Automated testing
- Deployment scripts
- Developer utilities

## Getting Help

If you need help with your contribution:

1. Check existing documentation and issues
2. Ask in the issue or PR comments
3. Reach out on [Discord/Telegram/etc]
4. Email: support@crashbytes.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be:
- Listed in the repository
- Credited in release notes
- Mentioned in the documentation

Thank you for helping improve the CrashBytes NFT Tutorial!

---

Questions? Contact: hello@crashbytes.com
