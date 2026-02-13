import { useState } from 'react';
import WalletConnect from './components/WalletConnect';
import MintNFT from './components/MintNFT';
import NFTGallery from './components/NFTGallery';
import './App.css';

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);

  return (
    <div className="App">
      <header className="App-header">
        <h1>CrashBytes NFT</h1>
        <WalletConnect 
          setProvider={setProvider}
          setAccount={setAccount}
        />
      </header>

      <main className="App-main">
        <section className="mint-section">
          <MintNFT provider={provider} account={account} />
        </section>

        <section className="gallery-section">
          <NFTGallery provider={provider} account={account} />
        </section>
      </main>

      <footer className="App-footer">
        <p>Built with the <a href="https://crashbytes.com/articles/tutorial-nft-smart-contract-development-web3-ethereum-full-stack-implementation-2025" target="_blank" rel="noopener noreferrer">CrashBytes NFT Tutorial</a></p>
      </footer>
    </div>
  );
}

export default App;
