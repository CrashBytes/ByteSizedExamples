const hre = require("hardhat");
const { generateAndUploadMetadata } = require('./upload-metadata');
const fs = require('fs');

async function main() {
  const [signer] = await hre.ethers.getSigners();
  
  // Load deployment info
  const deploymentPath = `deployments/${hre.network.name}.json`;
  
  if (!fs.existsSync(deploymentPath)) {
    console.error(`No deployment found for network ${hre.network.name}`);
    console.error('Please deploy the contract first using: npm run deploy:sepolia');
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const contractAddress = deployment.contractAddress;
  
  console.log('Minting NFT on network:', hre.network.name);
  console.log('Contract address:', contractAddress);
  console.log('Minter address:', signer.address);
  
  // Get contract instance
  const CrashBytesNFT = await hre.ethers.getContractFactory("CrashBytesNFT");
  const contract = CrashBytesNFT.attach(contractAddress);
  
  // Check if sale is active
  const saleIsActive = await contract.saleIsActive();
  
  if (!saleIsActive) {
    console.log('\nSale is not active. Activating sale...');
    const tx = await contract.flipSaleState();
    await tx.wait();
    console.log('Sale activated!');
  }
  
  // Get current supply to determine token ID
  const currentSupply = await contract.totalSupply();
  const nextTokenId = Number(currentSupply) + 1;
  
  console.log('\nCurrent supply:', currentSupply.toString());
  console.log('Next token ID:', nextTokenId);
  
  // Generate and upload metadata to IPFS
  console.log('\nGenerating and uploading metadata to IPFS...');
  const tokenURI = await generateAndUploadMetadata(nextTokenId);
  
  // Get mint price
  const mintPrice = await contract.mintPrice();
  console.log('\nMint price:', hre.ethers.formatEther(mintPrice), 'ETH');
  
  // Check signer balance
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log('Signer balance:', hre.ethers.formatEther(balance), 'ETH');
  
  if (balance < mintPrice) {
    console.error('\nInsufficient balance to mint NFT');
    console.error('Required:', hre.ethers.formatEther(mintPrice), 'ETH');
    console.error('Available:', hre.ethers.formatEther(balance), 'ETH');
    process.exit(1);
  }
  
  // Mint NFT
  console.log('\nMinting NFT...');
  const mintTx = await contract.mintNFT(signer.address, tokenURI, {
    value: mintPrice
  });
  
  console.log('Transaction hash:', mintTx.hash);
  console.log('Waiting for confirmation...');
  
  const receipt = await mintTx.wait();
  console.log('Transaction confirmed in block:', receipt.blockNumber);
  
  // Extract token ID from Transfer event
  const transferEvent = receipt.logs.find(
    log => log.topics[0] === hre.ethers.id('Transfer(address,address,uint256)')
  );
  
  if (transferEvent) {
    const tokenId = hre.ethers.toNumber(transferEvent.topics[3]);
    console.log('\nSuccessfully minted NFT #' + tokenId);
    console.log('Metadata URI:', tokenURI);
    console.log('Owner:', signer.address);
    
    // Save mint info
    const mintInfo = {
      network: hre.network.name,
      contractAddress: contractAddress,
      tokenId: tokenId,
      tokenURI: tokenURI,
      owner: signer.address,
      transactionHash: mintTx.hash,
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString()
    };
    
    const mintLogPath = `mints/${hre.network.name}-${tokenId}.json`;
    
    if (!fs.existsSync('mints')) {
      fs.mkdirSync('mints');
    }
    
    fs.writeFileSync(mintLogPath, JSON.stringify(mintInfo, null, 2));
    console.log('\nMint info saved to:', mintLogPath);
    
    // Display NFT URL
    if (hre.network.name === 'sepolia') {
      console.log('\nView on Etherscan:');
      console.log(`https://sepolia.etherscan.io/token/${contractAddress}?a=${tokenId}`);
    } else if (hre.network.name === 'mainnet') {
      console.log('\nView on Etherscan:');
      console.log(`https://etherscan.io/token/${contractAddress}?a=${tokenId}`);
      console.log('\nView on OpenSea:');
      console.log(`https://opensea.io/assets/ethereum/${contractAddress}/${tokenId}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
