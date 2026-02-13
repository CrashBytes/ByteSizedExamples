const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrashBytesNFT", function () {
  let crashBytesNFT;
  let owner;
  let addr1;
  let addr2;
  
  const NAME = "CrashBytes NFT";
  const SYMBOL = "CBN";
  const BASE_URI = "ipfs://QmTestBaseURI/";
  const MINT_PRICE = ethers.parseEther("0.05");
  
  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const CrashBytesNFT = await ethers.getContractFactory("CrashBytesNFT");
    crashBytesNFT = await CrashBytesNFT.deploy(NAME, SYMBOL, BASE_URI);
    await crashBytesNFT.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await crashBytesNFT.name()).to.equal(NAME);
      expect(await crashBytesNFT.symbol()).to.equal(SYMBOL);
    });
    
    it("Should set the correct owner", async function () {
      expect(await crashBytesNFT.owner()).to.equal(owner.address);
    });
    
    it("Should start with sale inactive", async function () {
      expect(await crashBytesNFT.saleIsActive()).to.equal(false);
    });
    
    it("Should set the correct mint price", async function () {
      expect(await crashBytesNFT.mintPrice()).to.equal(MINT_PRICE);
    });
    
    it("Should have zero total supply initially", async function () {
      expect(await crashBytesNFT.totalSupply()).to.equal(0);
    });
  });
  
  describe("Minting", function () {
    beforeEach(async function () {
      await crashBytesNFT.flipSaleState();
    });
    
    it("Should mint NFT with correct payment", async function () {
      const tokenURI = "ipfs://QmTestToken1";
      
      await expect(
        crashBytesNFT.connect(addr1).mintNFT(addr1.address, tokenURI, {
          value: MINT_PRICE
        })
      )
        .to.emit(crashBytesNFT, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, 1);
      
      expect(await crashBytesNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await crashBytesNFT.tokenURI(1)).to.include(tokenURI);
      expect(await crashBytesNFT.totalSupply()).to.equal(1);
    });
    
    it("Should reject minting when sale is inactive", async function () {
      await crashBytesNFT.flipSaleState();
      
      await expect(
        crashBytesNFT.connect(addr1).mintNFT(addr1.address, "test", {
          value: MINT_PRICE
        })
      ).to.be.revertedWith("Sale is not active");
    });
    
    it("Should reject minting with insufficient payment", async function () {
      await expect(
        crashBytesNFT.connect(addr1).mintNFT(addr1.address, "test", {
          value: ethers.parseEther("0.01")
        })
      ).to.be.revertedWith("Insufficient payment");
    });
    
    it("Should enforce per-address mint limit", async function () {
      for (let i = 0; i < 5; i++) {
        await crashBytesNFT.connect(addr1).mintNFT(
          addr1.address,
          `token${i}`,
          { value: MINT_PRICE }
        );
      }
      
      expect(await crashBytesNFT.mintedPerAddress(addr1.address)).to.equal(5);
      
      await expect(
        crashBytesNFT.connect(addr1).mintNFT(addr1.address, "token6", {
          value: MINT_PRICE
        })
      ).to.be.revertedWith("Max mints per address reached");
    });
    
    it("Should allow different addresses to mint independently", async function () {
      await crashBytesNFT.connect(addr1).mintNFT(addr1.address, "token1", {
        value: MINT_PRICE
      });
      
      await crashBytesNFT.connect(addr2).mintNFT(addr2.address, "token2", {
        value: MINT_PRICE
      });
      
      expect(await crashBytesNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await crashBytesNFT.ownerOf(2)).to.equal(addr2.address);
    });
    
    it("Should accept excess payment", async function () {
      const excessPayment = ethers.parseEther("0.1");
      
      await expect(
        crashBytesNFT.connect(addr1).mintNFT(addr1.address, "token1", {
          value: excessPayment
        })
      ).to.not.be.reverted;
      
      expect(await crashBytesNFT.ownerOf(1)).to.equal(addr1.address);
    });
  });
  
  describe("Batch Minting", function () {
    it("Should batch mint multiple tokens (owner only)", async function () {
      const recipients = [addr1.address, addr2.address];
      const tokenURIs = ["token1", "token2"];
      
      await crashBytesNFT.batchMint(recipients, tokenURIs);
      
      expect(await crashBytesNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await crashBytesNFT.ownerOf(2)).to.equal(addr2.address);
      expect(await crashBytesNFT.totalSupply()).to.equal(2);
    });
    
    it("Should reject batch mint from non-owner", async function () {
      const recipients = [addr1.address];
      const tokenURIs = ["token1"];
      
      await expect(
        crashBytesNFT.connect(addr1).batchMint(recipients, tokenURIs)
      ).to.be.revertedWithCustomError(crashBytesNFT, "OwnableUnauthorizedAccount");
    });
    
    it("Should reject batch mint with mismatched arrays", async function () {
      const recipients = [addr1.address, addr2.address];
      const tokenURIs = ["token1"];
      
      await expect(
        crashBytesNFT.batchMint(recipients, tokenURIs)
      ).to.be.revertedWith("Arrays must have equal length");
    });
    
    it("Should reject batch mint exceeding supply", async function () {
      const recipients = new Array(10001).fill(addr1.address);
      const tokenURIs = new Array(10001).fill("token");
      
      await expect(
        crashBytesNFT.batchMint(recipients, tokenURIs)
      ).to.be.revertedWith("Would exceed max supply");
    });
  });
  
  describe("Admin Functions", function () {
    it("Should allow owner to flip sale state", async function () {
      expect(await crashBytesNFT.saleIsActive()).to.equal(false);
      
      await crashBytesNFT.flipSaleState();
      expect(await crashBytesNFT.saleIsActive()).to.equal(true);
      
      await crashBytesNFT.flipSaleState();
      expect(await crashBytesNFT.saleIsActive()).to.equal(false);
    });
    
    it("Should reject sale state flip from non-owner", async function () {
      await expect(
        crashBytesNFT.connect(addr1).flipSaleState()
      ).to.be.revertedWithCustomError(crashBytesNFT, "OwnableUnauthorizedAccount");
    });
    
    it("Should allow owner to update mint price", async function () {
      const newPrice = ethers.parseEther("0.1");
      await crashBytesNFT.setMintPrice(newPrice);
      expect(await crashBytesNFT.mintPrice()).to.equal(newPrice);
    });
    
    it("Should reject mint price update from non-owner", async function () {
      const newPrice = ethers.parseEther("0.1");
      await expect(
        crashBytesNFT.connect(addr1).setMintPrice(newPrice)
      ).to.be.revertedWithCustomError(crashBytesNFT, "OwnableUnauthorizedAccount");
    });
    
    it("Should allow owner to update base URI", async function () {
      const newBaseURI = "ipfs://QmNewBaseURI/";
      await crashBytesNFT.setBaseURI(newBaseURI);
      
      await crashBytesNFT.flipSaleState();
      await crashBytesNFT.connect(addr1).mintNFT(addr1.address, "token1", {
        value: MINT_PRICE
      });
      
      const tokenURI = await crashBytesNFT.tokenURI(1);
      expect(tokenURI).to.include(newBaseURI);
    });
    
    it("Should allow owner to withdraw funds", async function () {
      await crashBytesNFT.flipSaleState();
      
      await crashBytesNFT.connect(addr1).mintNFT(addr1.address, "token1", {
        value: MINT_PRICE
      });
      
      const contractBalance = await ethers.provider.getBalance(
        await crashBytesNFT.getAddress()
      );
      expect(contractBalance).to.equal(MINT_PRICE);
      
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      const tx = await crashBytesNFT.withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(balanceAfter).to.equal(balanceBefore + MINT_PRICE - gasUsed);
    });
    
    it("Should reject withdrawal with zero balance", async function () {
      await expect(
        crashBytesNFT.withdraw()
      ).to.be.revertedWith("No balance to withdraw");
    });
    
    it("Should reject withdrawal from non-owner", async function () {
      await crashBytesNFT.flipSaleState();
      await crashBytesNFT.connect(addr1).mintNFT(addr1.address, "token1", {
        value: MINT_PRICE
      });
      
      await expect(
        crashBytesNFT.connect(addr1).withdraw()
      ).to.be.revertedWithCustomError(crashBytesNFT, "OwnableUnauthorizedAccount");
    });
  });
  
  describe("Supply Limits", function () {
    it("Should enforce maximum supply", async function () {
      const maxSupply = await crashBytesNFT.MAX_SUPPLY();
      expect(maxSupply).to.equal(10000);
    });
    
    it("Should enforce per-address maximum", async function () {
      const maxPerAddress = await crashBytesNFT.MAX_PER_ADDRESS();
      expect(maxPerAddress).to.equal(5);
    });
  });
  
  describe("Token Transfers", function () {
    beforeEach(async function () {
      await crashBytesNFT.flipSaleState();
      await crashBytesNFT.connect(addr1).mintNFT(addr1.address, "token1", {
        value: MINT_PRICE
      });
    });
    
    it("Should transfer token from one address to another", async function () {
      await crashBytesNFT.connect(addr1).transferFrom(
        addr1.address,
        addr2.address,
        1
      );
      
      expect(await crashBytesNFT.ownerOf(1)).to.equal(addr2.address);
    });
    
    it("Should emit Transfer event on transfer", async function () {
      await expect(
        crashBytesNFT.connect(addr1).transferFrom(
          addr1.address,
          addr2.address,
          1
        )
      )
        .to.emit(crashBytesNFT, "Transfer")
        .withArgs(addr1.address, addr2.address, 1);
    });
  });
  
  describe("Token URI", function () {
    beforeEach(async function () {
      await crashBytesNFT.flipSaleState();
    });
    
    it("Should return correct token URI", async function () {
      const tokenURI = "metadata1.json";
      await crashBytesNFT.connect(addr1).mintNFT(addr1.address, tokenURI, {
        value: MINT_PRICE
      });
      
      const retrievedURI = await crashBytesNFT.tokenURI(1);
      expect(retrievedURI).to.include(tokenURI);
    });
    
    it("Should revert for non-existent token", async function () {
      await expect(
        crashBytesNFT.tokenURI(999)
      ).to.be.reverted;
    });
  });
});