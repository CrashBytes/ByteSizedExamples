# Deployment Records

This directory stores deployment information for each network.

## Files

Each deployment creates a JSON file named after the network:

- `localhost.json` - Local Hardhat network deployments
- `sepolia.json` - Sepolia testnet deployment
- `mainnet.json` - Ethereum mainnet deployment

## Deployment File Structure

```json
{
  "network": "sepolia",
  "contractAddress": "0x...",
  "deployer": "0x...",
  "timestamp": "2025-12-18T10:30:00.000Z",
  "name": "CrashBytes NFT",
  "symbol": "CBN",
  "baseURI": "ipfs://QmBaseURI/"
}
```

## Usage

The deploy.js script automatically creates these files during deployment.

Other scripts (like mint.js) read these files to interact with deployed contracts:

```javascript
const deployment = require('../deployments/sepolia.json');
const contract = CrashBytesNFT.attach(deployment.contractAddress);
```

## Security Note

These files contain public contract addresses and are safe to commit to version control.

Do NOT commit files containing private keys or sensitive information.
