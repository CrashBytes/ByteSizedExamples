const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("========================================");
  console.log("CrashBytes NFT Deployment");
  console.log("========================================");
  console.log("\nDeploying contracts with account:", deployer.address);
  
  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance < hre.ethers.parseEther("0.05")) {
    console.warn("\nWARNING: Low balance. Deployment may fail.");
  }
  
  // Deploy contract
  const CrashBytesNFT = await hre.ethers.getContractFactory("CrashBytesNFT");
  
  const name = "CrashBytes NFT";
  const symbol = "CBN";
  const baseURI = "ipfs://QmYourBaseURIHere/";
  
  console.log("\nDeployment parameters:");
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Base URI:", baseURI);
  
  console.log("\nDeploying CrashBytesNFT contract...");
  const crashBytesNFT = await CrashBytesNFT.deploy(name, symbol, baseURI);
  
  await crashBytesNFT.waitForDeployment();
  const contractAddress = await crashBytesNFT.getAddress();
  
  console.log("\nCrashBytesNFT deployed to:", contractAddress);
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    name: name,
    symbol: symbol,
    baseURI: baseURI,
    transactionHash: crashBytesNFT.deploymentTransaction().hash
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\nDeployment info saved to:", deploymentFile);
  
  // Wait for block confirmations before verification
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await crashBytesNFT.deploymentTransaction().wait(6);
    
    console.log("\nVerifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [name, symbol, baseURI],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("Contract already verified");
      } else {
        console.error("Verification failed:", error.message);
      }
    }
  }
  
  console.log("\n========================================");
  console.log("Deployment complete!");
  console.log("========================================");
  console.log("\nContract address:", contractAddress);
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  
  console.log("\nNext steps:");
  console.log("1. Update your .env file with:");
  console.log(`   REACT_APP_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("2. Enable minting: npx hardhat run scripts/enable-sale.js --network", hre.network.name);
  console.log("3. Mint NFTs: npx hardhat run scripts/mint.js --network", hre.network.name);
  
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("4. View on Etherscan:");
    const etherscanBase = hre.network.name === "mainnet" 
      ? "https://etherscan.io" 
      : `https://${hre.network.name}.etherscan.io`;
    console.log(`   ${etherscanBase}/address/${contractAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });