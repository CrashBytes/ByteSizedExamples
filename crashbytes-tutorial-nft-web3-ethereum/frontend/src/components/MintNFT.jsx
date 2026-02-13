import { useState } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contracts/CrashBytesNFT.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

export default function MintNFT({ provider, account }) {
  const [minting, setMinting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [tokenId, setTokenId] = useState(null);
  
  async function mintNFT() {
    if (!provider || !account) {
      alert('Please connect your wallet first');
      return;
    }
    
    setMinting(true);
    setTxHash('');
    setTokenId(null);
    
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI.abi,
        signer
      );
      
      // Check if sale is active
      const saleIsActive = await contract.saleIsActive();
      if (!saleIsActive) {
        alert('Sale is not active yet');
        setMinting(false);
        return;
      }
      
      // Get mint price
      const mintPrice = await contract.mintPrice();
      
      // Get current supply
      const currentSupply = await contract.totalSupply();
      const tokenURI = `ipfs://QmExample/${currentSupply + 1}.json`;
      
      // Send mint transaction
      const tx = await contract.mintNFT(account, tokenURI, {
        value: mintPrice
      });
      
      setTxHash(tx.hash);
      console.log('Transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      // Extract token ID from Transfer event
      const transferEvent = receipt.logs.find(
        log => log.topics[0] === ethers.id('Transfer(address,address,uint256)')
      );
      
      if (transferEvent) {
        const newTokenId = ethers.toNumber(transferEvent.topics[3]);
        setTokenId(newTokenId);
      }
      
      alert('NFT minted successfully!');
    } catch (error) {
      console.error('Minting error:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction rejected by user');
      } else if (error.message.includes('Insufficient payment')) {
        alert('Insufficient ETH sent for minting');
      } else if (error.message.includes('Max supply reached')) {
        alert('Maximum supply has been reached');
      } else {
        alert('Error minting NFT: ' + error.message);
      }
    } finally {
      setMinting(false);
    }
  }
  
  return (
    <div className="mint-container">
      <h2>Mint Your NFT</h2>
      
      <button 
        onClick={mintNFT}
        disabled={minting || !account}
        className="mint-button"
      >
        {minting ? 'Minting...' : 'Mint NFT'}
      </button>
      
      {txHash && (
        <div className="transaction-info">
          <p>Transaction Hash:</p>
          <a 
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
          </a>
        </div>
      )}
      
      {tokenId && (
        <div className="success-info">
          <p>Successfully minted NFT #{tokenId}!</p>
        </div>
      )}
    </div>
  );
}
