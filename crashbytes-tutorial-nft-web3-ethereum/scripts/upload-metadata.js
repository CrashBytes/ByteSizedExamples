const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_KEY
);

/**
 * Upload a single image file to IPFS
 * @param {string} imagePath Path to the image file
 * @returns {Promise<string>} IPFS URI for the image
 */
async function uploadImage(imagePath) {
  console.log(`Uploading image: ${path.basename(imagePath)}`);
  
  const readableStreamForFile = fs.createReadStream(imagePath);
  
  const options = {
    pinataMetadata: {
      name: path.basename(imagePath)
    }
  };
  
  try {
    const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
    const ipfsURI = `ipfs://${result.IpfsHash}`;
    console.log(`Image uploaded: ${ipfsURI}`);
    return ipfsURI;
  } catch (error) {
    console.error(`Error uploading image: ${error.message}`);
    throw error;
  }
}

/**
 * Upload metadata JSON to IPFS
 * @param {object} metadata Metadata object
 * @returns {Promise<string>} IPFS URI for the metadata
 */
async function uploadMetadata(metadata) {
  console.log(`Uploading metadata for: ${metadata.name}`);
  
  const options = {
    pinataMetadata: {
      name: `metadata-${metadata.name}`
    }
  };
  
  try {
    const result = await pinata.pinJSONToIPFS(metadata, options);
    const ipfsURI = `ipfs://${result.IpfsHash}`;
    console.log(`Metadata uploaded: ${ipfsURI}`);
    return ipfsURI;
  } catch (error) {
    console.error(`Error uploading metadata: ${error.message}`);
    throw error;
  }
}

/**
 * Generate and upload complete metadata for a token
 * @param {number} tokenId Token ID
 * @param {object} attributes Optional attributes to include
 * @returns {Promise<string>} IPFS URI for the metadata
 */
async function generateAndUploadMetadata(tokenId, attributes = []) {
  console.log(`\nProcessing token #${tokenId}`);
  
  // Upload image first
  const imagePath = path.join(__dirname, '../metadata/images', `${tokenId}.png`);
  
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image not found: ${imagePath}`);
  }
  
  const imageURI = await uploadImage(imagePath);
  
  // Create metadata object
  const metadata = {
    name: `CrashBytes NFT #${tokenId}`,
    description: "A unique digital collectible from the CrashBytes collection. Part of the comprehensive NFT tutorial series teaching Web3 development from zero to production.",
    image: imageURI,
    attributes: attributes.length > 0 ? attributes : [
      {
        trait_type: "Collection",
        value: "CrashBytes Tutorial"
      },
      {
        trait_type: "Edition",
        value: tokenId
      },
      {
        trait_type: "Rarity",
        value: tokenId <= 100 ? "Genesis" : "Standard"
      }
    ]
  };
  
  // Upload metadata
  const metadataURI = await uploadMetadata(metadata);
  
  console.log(`Token ${tokenId} complete!`);
  console.log(`Metadata URI: ${metadataURI}\n`);
  
  return metadataURI;
}

/**
 * Upload metadata for multiple tokens
 * @param {number} startId Starting token ID
 * @param {number} count Number of tokens to process
 * @returns {Promise<Array<string>>} Array of metadata URIs
 */
async function batchUploadMetadata(startId, count) {
  console.log(`\n========================================`);
  console.log(`Batch Upload: ${count} tokens starting from #${startId}`);
  console.log(`========================================\n`);
  
  const metadataURIs = [];
  
  for (let i = 0; i < count; i++) {
    const tokenId = startId + i;
    try {
      const uri = await generateAndUploadMetadata(tokenId);
      metadataURIs.push({
        tokenId,
        uri
      });
    } catch (error) {
      console.error(`Failed to process token #${tokenId}:`, error.message);
      continue;
    }
  }
  
  console.log(`\n========================================`);
  console.log(`Batch Upload Complete`);
  console.log(`========================================`);
  console.log(`Successfully uploaded: ${metadataURIs.length}/${count} tokens\n`);
  
  return metadataURIs;
}

// Main execution
async function main() {
  if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
    console.error("Error: PINATA_API_KEY and PINATA_SECRET_KEY must be set in .env file");
    process.exit(1);
  }
  
  // Test Pinata connection
  try {
    await pinata.testAuthentication();
    console.log("Pinata authentication successful\n");
  } catch (error) {
    console.error("Pinata authentication failed:", error.message);
    process.exit(1);
  }
  
  // Example usage - customize as needed
  const args = process.argv.slice(2);
  
  if (args[0] === 'batch') {
    const startId = parseInt(args[1]) || 1;
    const count = parseInt(args[2]) || 10;
    await batchUploadMetadata(startId, count);
  } else {
    // Upload single token
    const tokenId = parseInt(args[0]) || 1;
    await generateAndUploadMetadata(tokenId);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  uploadImage,
  uploadMetadata,
  generateAndUploadMetadata,
  batchUploadMetadata
};