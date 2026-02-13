import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/CrashBytesNFT.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

export default function NFTGallery({ provider, account }) {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (provider && account) {
      loadNFTs();
    }
  }, [provider, account]);
  
  async function loadNFTs() {
    setLoading(true);
    
    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI.abi,
        provider
      );
      
      // Get balance
      const balance = await contract.balanceOf(account);
      const balanceNumber = ethers.toNumber(balance);
      
      console.log(`Account owns ${balanceNumber} NFTs`);
      
      // Get all token IDs owned by account
      const tokenIds = [];
      const totalSupply = await contract.totalSupply();
      
      for (let i = 1; i <= totalSupply; i++) {
        try {
          const owner = await contract.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) {
            tokenIds.push(i);
          }
        } catch (error) {
          // Token might not exist yet
          continue;
        }
      }
      
      // Fetch metadata for each token
      const nftData = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const tokenURI = await contract.tokenURI(tokenId);
          
          // Fetch metadata from IPFS
          let metadata = {};
          if (tokenURI.startsWith('ipfs://')) {
            const ipfsGateway = 'https://gateway.pinata.cloud/ipfs/';
            const cid = tokenURI.replace('ipfs://', '');
            
            try {
              const response = await fetch(ipfsGateway + cid);
              metadata = await response.json();
            } catch (error) {
              console.error(`Failed to fetch metadata for token ${tokenId}:`, error);
            }
          }
          
          return {
            tokenId,
            tokenURI,
            ...metadata
          };
        })
      );
      
      setNfts(nftData);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    } finally {
      setLoading(false);
    }
  }
  
  function getImageUrl(imageURI) {
    if (imageURI && imageURI.startsWith('ipfs://')) {
      const ipfsGateway = 'https://gateway.pinata.cloud/ipfs/';
      return imageURI.replace('ipfs://', ipfsGateway);
    }
    return imageURI || '/placeholder.png';
  }
  
  if (!account) {
    return (
      <div className="gallery-message">
        <p>Connect your wallet to view your NFTs</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="gallery-loading">
        <p>Loading your NFTs...</p>
      </div>
    );
  }
  
  if (nfts.length === 0) {
    return (
      <div className="gallery-empty">
        <p>You don't own any NFTs yet</p>
        <p>Mint your first NFT to get started!</p>
      </div>
    );
  }
  
  return (
    <div className="nft-gallery">
      <h2>Your NFTs ({nfts.length})</h2>
      
      <div className="nft-grid">
        {nfts.map((nft) => (
          <div key={nft.tokenId} className="nft-card">
            <img 
              src={getImageUrl(nft.image)} 
              alt={nft.name || `NFT #${nft.tokenId}`}
              className="nft-image"
            />
            <div className="nft-info">
              <h3>{nft.name || `NFT #${nft.tokenId}`}</h3>
              <p className="nft-description">{nft.description}</p>
              
              {nft.attributes && nft.attributes.length > 0 && (
                <div className="nft-attributes">
                  {nft.attributes.map((attr, index) => (
                    <div key={index} className="attribute">
                      <span className="trait">{attr.trait_type}:</span>
                      <span className="value">{attr.value}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <a
                href={`https://sepolia.etherscan.io/token/${CONTRACT_ADDRESS}?a=${nft.tokenId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="view-on-etherscan"
              >
                View on Etherscan
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
