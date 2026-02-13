# Mint Records

This directory stores records of minted NFTs for tracking and verification.

## Files

Each mint operation creates a JSON file named after the network and token ID:

- `sepolia-1.json` - Token #1 minted on Sepolia
- `sepolia-2.json` - Token #2 minted on Sepolia
- `mainnet-1.json` - Token #1 minted on mainnet

## Mint Record Structure

```json
{
  "network": "sepolia",
  "contractAddress": "0x...",
  "tokenId": 1,
  "tokenURI": "ipfs://QmMetadataHash...",
  "owner": "0x...",
  "transactionHash": "0x...",
  "blockNumber": 12345678,
  "timestamp": "2025-12-18T10:30:00.000Z"
}
```

## Usage

The mint.js script automatically creates these files after successful minting.

You can use these records to:

- Track which tokens have been minted
- Verify token ownership and metadata
- Generate reports of minting activity
- Audit minting operations

## Example Query

Find all mints on Sepolia:

```bash
ls mints/sepolia-*.json
```

View a specific mint record:

```bash
cat mints/sepolia-1.json
```

## Git Ignore

Add `mints/*.json` to .gitignore if you don't want to commit mint records to version control.

These files contain public blockchain data and are generally safe to commit.
