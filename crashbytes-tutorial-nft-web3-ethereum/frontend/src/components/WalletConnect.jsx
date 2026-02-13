import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

export default function WalletConnect({ setProvider: setParentProvider, setAccount: setParentAccount }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);
  
  async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask to use this application');
      return;
    }
    
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create ethers provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      
      setProvider(provider);
      setAccount(address);
      setChainId(Number(network.chainId));
      
      // Update parent state
      if (setParentProvider) setParentProvider(provider);
      if (setParentAccount) setParentAccount(address);
      
      console.log('Connected to wallet:', address);
      console.log('Network:', network.name, 'ChainID:', network.chainId);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    }
  }
  
  async function switchToSepoliaNetwork() {
    const sepoliaChainId = '0xaa36a7'; // 11155111 in hex
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: sepoliaChainId }],
      });
    } catch (error) {
      if (error.code === 4902) {
        // Chain not added, request to add it
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: sepoliaChainId,
            chainName: 'Sepolia Test Network',
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io/']
          }]
        });
      }
    }
  }
  
  async function disconnectWallet() {
    setAccount(null);
    setProvider(null);
    setChainId(null);
    
    // Update parent state
    if (setParentProvider) setParentProvider(null);
    if (setParentAccount) setParentAccount(null);
  }
  
  // Listen for account and network changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      });
      
      window.ethereum.on('chainChanged', (chainId) => {
        setChainId(parseInt(chainId, 16));
      });
    }
    
    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);
  
  function formatAddress(address) {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
  
  return (
    <div className="wallet-connect">
      {!account ? (
        <button onClick={connectWallet} className="connect-button">
          Connect Wallet
        </button>
      ) : (
        <div className="wallet-info">
          <span className="address">{formatAddress(account)}</span>
          {chainId !== 11155111 && (
            <button onClick={switchToSepoliaNetwork} className="network-button">
              Switch to Sepolia
            </button>
          )}
          <button onClick={disconnectWallet} className="disconnect-button">
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
