# CrashBytes NFT Tutorial - Complete Web3 Implementation

Build production-ready NFT smart contracts from scratch with Solidity, OpenZeppelin, and Web3.js. This repository contains all code from the [CrashBytes NFT Tutorial](https://crashbytes.com/articles/tutorial-nft-smart-contract-development-web3-ethereum-full-stack-implementation-2025).

## What You'll Build

- ERC-721 compliant NFT smart contract with OpenZeppelin standards
- IPFS-based metadata system for decentralized storage
- Minting and transfer functionality with proper access controls
- Web3 frontend integration using Ethers.js
- Wallet connection system supporting MetaMask
- NFT gallery interface displaying owned tokens
- Gas-optimized contract patterns
- Security best practices and testing suite

## Repository Structure

```
crashbytes-tutorial-nft-web3-ethereum/
├── contracts/
│   ├── CrashBytesNFT.sol           # Main NFT contract
│   └── Marketplace.sol              # Optional marketplace contract
├── test/
│   ├── CrashBytesNFT.test.js       # Contract unit tests
│   └── integration.test.js          # Integration tests
├── scripts/
│   ├── deploy.js                    # Deployment script
│   ├── mint.js                      # Minting utility
│   └── upload-metadata.js           # IPFS upload script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── WalletConnect.jsx   # Wallet connection
│   │   │   ├── MintNFT.jsx         # Minting interface
│   │   │   └── NFTGallery.jsx      # Gallery display
│   │   ├── utils/
│   │   │   ├── contract.js         # Contract interactions
│   │   │   └── ipfs.js             # IPFS utilities
│   │   └── App.jsx                 # Main application
│   └── package.json
├── metadata/
│   ├── images/                      # NFT artwork
│   └── json/                        # Metadata JSON files
├── hardhat.config.js                # Hardhat configuration
├── package.json                     # Dependencies
└── README.md                        # This file
```

## Prerequisites

- Node.js v16 or later
- npm or yarn
- MetaMask browser extension
- Basic understanding of JavaScript and React
- Ethereum testnet ETH from Sepolia faucet

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/CrashBytes/crashbytes-tutorial-nft-web3-ethereum.git
cd crashbytes-tutorial-nft-web3-ethereum
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_wallet_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

### 4. Get Testnet ETH

Visit the [Sepolia Faucet](https://sepoliafaucet.com) to get testnet ETH for deployment and testing.

## Smart Contract Development

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

### Check Test Coverage

```bash
npx hardhat coverage
```

### Deploy to Local Network

```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### Deploy to Sepolia Testnet

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Deploy to Mainnet

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

## IPFS Metadata Management

### Upload Images to IPFS

```bash
node scripts/upload-metadata.js
```

This script:
1. Uploads images from `metadata/images/` to IPFS
2. Generates metadata JSON with IPFS image URIs
3. Uploads metadata to IPFS
4. Returns metadata URIs for minting

### Metadata Format

```json
{
  "name": "CrashBytes NFT #1",
  "description": "A unique digital collectible",
  "image": "ipfs://QmHash...",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Blue"
    },
    {
      "trait_type": "Rarity",
      "value": "Legendary"
    }
  ]
}
```

## Frontend Development

### Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Configure Frontend

Create `frontend/.env`:

```bash
REACT_APP_CONTRACT_ADDRESS=your_deployed_contract_address
REACT_APP_NETWORK_ID=11155111
```

### Run Development Server

```bash
npm start
```

The application will open at http://localhost:3000

### Build for Production

```bash
npm run build
```

## Using the Application

### 1. Connect Wallet

- Click "Connect Wallet"
- Approve MetaMask connection
- Switch to Sepolia network if prompted

### 2. Mint NFT

- Ensure you have sufficient testnet ETH
- Click "Mint NFT"
- Approve transaction in MetaMask
- Wait for transaction confirmation

### 3. View Your NFTs

- Connected wallet automatically displays owned NFTs
- View metadata, images, and attributes
- Click to view on Etherscan

## Contract Features

### Core Functionality

- **ERC-721 Standard**: Full compliance with ERC-721 interface
- **Max Supply**: Configurable supply cap (default 10,000)
- **Mint Price**: Adjustable mint price in ETH
- **Per-Address Limit**: Maximum mints per wallet (default 5)
- **Sale Control**: Owner can activate/deactivate minting
- **Batch Minting**: Gas-efficient batch mint for airdrops

### Security Features

- **Access Control**: OpenZeppelin Ownable for admin functions
- **Reentrancy Protection**: Safe against reentrancy attacks
- **Input Validation**: Comprehensive validation of all inputs
- **Safe Transfers**: Uses safeMint to prevent token loss

### Gas Optimizations

- **Storage Packing**: Efficient use of storage slots
- **Batch Operations**: Amortized costs for multiple mints
- **External Functions**: Uses calldata for parameter passing
- **Optimized Loops**: Minimal on-chain iteration

## Testing Strategy

### Unit Tests

Located in `test/CrashBytesNFT.test.js`:

- Deployment verification
- Minting with correct payment
- Rejection of insufficient payment
- Sale state management
- Supply limits enforcement
- Per-address mint limits
- Batch minting functionality
- Owner withdrawal
- Access control verification

### Integration Tests

Located in `test/integration.test.js`:

- End-to-end minting workflow
- IPFS metadata integration
- Frontend contract interactions
- Multi-user scenarios
- Gas cost verification

### Running Specific Tests

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/CrashBytesNFT.test.js

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

## Security Considerations

### Before Mainnet Deployment

- [ ] Complete professional security audit
- [ ] Test all functionality on testnets
- [ ] Verify metadata IPFS persistence
- [ ] Confirm mint price and supply limits
- [ ] Review all access control mechanisms
- [ ] Test edge cases and failure modes
- [ ] Verify contract on Etherscan
- [ ] Document emergency procedures

### Common Vulnerabilities Addressed

- **Reentrancy**: Uses OpenZeppelin's battle-tested patterns
- **Integer Overflow**: Solidity 0.8.x automatic checks
- **Access Control**: Proper use of onlyOwner modifier
- **Front-Running**: Consider using commit-reveal for valuable tokens
- **Gas Griefing**: Batch operations use safe patterns

## Gas Costs

Typical gas costs on Sepolia (will vary on mainnet):

- **Contract Deployment**: ~3,000,000 gas
- **Single Mint**: ~150,000 gas
- **Batch Mint (10 tokens)**: ~800,000 gas (80k per token)
- **Transfer**: ~50,000 gas
- **Approve**: ~45,000 gas

## Troubleshooting

### MetaMask Issues

**Problem**: Wallet won't connect
- Solution: Ensure MetaMask is installed and unlocked
- Check that you're on the correct network
- Try refreshing the page

**Problem**: Transaction fails immediately
- Solution: Check for pending transactions
- Ensure sufficient ETH balance for gas
- Verify sale is active

### IPFS Issues

**Problem**: Images not loading
- Solution: Check Pinata pinning status
- Verify IPFS gateway is responding
- Try alternative gateway in code

**Problem**: Metadata not found
- Solution: Verify metadata was uploaded to IPFS
- Check metadata URI format
- Ensure CID is correct

### Contract Issues

**Problem**: "Out of gas" errors
- Solution: Increase gas limit in MetaMask
- Check for unexpected state conditions
- Review contract logic for gas-heavy operations

**Problem**: "Max supply reached"
- Solution: Verify current supply hasn't hit cap
- Check MAX_SUPPLY constant in contract

## Production Deployment Checklist

- [ ] Security audit completed
- [ ] All tests passing
- [ ] Testnet deployment successful
- [ ] Metadata uploaded to IPFS
- [ ] Contract verified on Etherscan
- [ ] Mint price confirmed
- [ ] Supply limits set correctly
- [ ] Deployment wallet funded
- [ ] Emergency procedures documented
- [ ] Monitoring systems configured

## Advanced Features

### Royalty Implementation (EIP-2981)

Enable royalties on marketplace sales:

```solidity
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract CrashBytesNFT is ERC721, ERC2981 {
    constructor() {
        _setDefaultRoyalty(owner(), 500); // 5% royalty
    }
}
```

### Whitelist Minting

Implement presale with Merkle tree:

```solidity
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

function whitelistMint(bytes32[] calldata proof) external payable {
    require(!whitelistClaimed[msg.sender], "Already claimed");
    bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
    require(MerkleProof.verify(proof, merkleRoot, leaf), "Not whitelisted");
    // Mint logic
}
```

### Reveal Mechanism

Implement delayed reveal:

```solidity
bool public revealed = false;
string public placeholderURI;

function tokenURI(uint256 tokenId) public view override returns (string memory) {
    if (!revealed) return placeholderURI;
    return super.tokenURI(tokenId);
}

function reveal() external onlyOwner {
    revealed = true;
}
```

## Resources

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethereum Development Documentation](https://ethereum.org/developers)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Pinata Documentation](https://docs.pinata.cloud/)

## Support

For questions and support:

- Open an issue in this repository
- Visit [CrashBytes](https://crashbytes.com)
- Read the full tutorial at [crashbytes.com/articles/tutorial-nft-smart-contract-development-web3-ethereum-full-stack-implementation-2025](https://crashbytes.com/articles/tutorial-nft-smart-contract-development-web3-ethereum-full-stack-implementation-2025)

## License

MIT License - see LICENSE file for details

## Author

**Michael Eakins**  
CrashBytes - Technical publication focused on AI, Web3, and enterprise technology

---

Built with the [CrashBytes NFT Tutorial](https://crashbytes.com/articles/tutorial-nft-smart-contract-development-web3-ethereum-full-stack-implementation-2025)