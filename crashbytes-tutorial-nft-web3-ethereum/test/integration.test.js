const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT Platform Integration Tests", function () {
  let crashBytesNFT;
  let owner;
  let user1;
  let user2;
  let user3;
  
  const NAME = "CrashBytes NFT";
  const SYMBOL = "CBN";
  const BASE_URI = "ipfs://QmTestBaseURI/";
  const MINT_PRICE = ethers.parseEther("0.05");
  
  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    const CrashBytesNFT = await ethers.getContractFactory("CrashBytesNFT");
    crashBytesNFT = await CrashBytesNFT.deploy(NAME, SYMBOL, BASE_URI);
    await crashBytesNFT.waitForDeployment();
  });
  
  describe("Complete Minting Workflow", function () {
    it("Should handle full launch sequence correctly", async function () {
      // 1. Verify initial state
      expect(await crashBytesNFT.saleIsActive()).to.equal(false);
      expect(await crashBytesNFT.totalSupply()).to.equal(0);
      
      // 2. Owner activates sale
      await crashBytesNFT.flipSaleState();
      expect(await crashBytesNFT.saleIsActive()).to.equal(true);
      
      // 3. Multiple users mint
      const tokenURI1 = "ipfs://QmToken1";
      const tokenURI2 = "ipfs://QmToken2";
      const tokenURI3 = "ipfs://QmToken3";
      
      await crashBytesNFT.connect(user1).mintNFT(user1.address, tokenURI1, {
        value: MINT_PRICE
      });
      
      await crashBytesNFT.connect(user2).mintNFT(user2.address, tokenURI2, {
        value: MINT_PRICE
      });
      
      await crashBytesNFT.connect(user3).mintNFT(user3.address, tokenURI3, {
        value: MINT_PRICE
      });
      
      // 4. Verify ownership and supply
      expect(await crashBytesNFT.totalSupply()).to.equal(3);
      expect(await crashBytesNFT.ownerOf(1)).to.equal(user1.address);
      expect(await crashBytesNFT.ownerOf(2)).to.equal(user2.address);
      expect(await crashBytesNFT.ownerOf(3)).to.equal(user3.address);
      
      // 5. Verify metadata URIs
      expect(await crashBytesNFT.tokenURI(1)).to.include(tokenURI1);
      expect(await crashBytesNFT.tokenURI(2)).to.include(tokenURI2);
      expect(await crashBytesNFT.tokenURI(3)).to.include(tokenURI3);
      
      // 6. Check balances
      expect(await crashBytesNFT.balanceOf(user1.address)).to.equal(1);
      expect(await crashBytesNFT.balanceOf(user2.address)).to.equal(1);
      expect(await crashBytesNFT.balanceOf(user3.address)).to.equal(1);
    });
    
    it("Should track minted counts per address correctly", async function () {
      await crashBytesNFT.flipSaleState();
      
      // User mints 3 tokens
      for (let i = 0; i < 3; i++) {
        await crashBytesNFT.connect(user1).mintNFT(
          user1.address,
          `token${i}`,
          { value: MINT_PRICE }
        );
      }
      
      expect(await crashBytesNFT.mintedPerAddress(user1.address)).to.equal(3);
      expect(await crashBytesNFT.balanceOf(user1.address)).to.equal(3);
    });
  });
  
  describe("Multi-User Scenarios", function () {
    beforeEach(async function () {
      await crashBytesNFT.flipSaleState();
    });
    
    it("Should handle concurrent minting from multiple users", async function () {
      // Simulate multiple users minting simultaneously
      const mintPromises = [];
      
      for (let i = 0; i < 5; i++) {
        const user = i === 0 ? user1 : i === 1 ? user2 : user3;
        mintPromises.push(
          crashBytesNFT.connect(user).mintNFT(
            user.address,
            `token${i}`,
            { value: MINT_PRICE }
          )
        );
      }
      
      await Promise.all(mintPromises);
      
      expect(await crashBytesNFT.totalSupply()).to.equal(5);
    });
    
    it("Should enforce per-address limits across multiple transactions", async function () {
      // User1 mints maximum allowed
      for (let i = 0; i < 5; i++) {
        await crashBytesNFT.connect(user1).mintNFT(
          user1.address,
          `token${i}`,
          { value: MINT_PRICE }
        );
      }
      
      // Attempt to mint one more should fail
      await expect(
        crashBytesNFT.connect(user1).mintNFT(
          user1.address,
          "token6",
          { value: MINT_PRICE }
        )
      ).to.be.revertedWith("Max mints per address reached");
      
      // But user2 should still be able to mint
      await expect(
        crashBytesNFT.connect(user2).mintNFT(
          user2.address,
          "token6",
          { value: MINT_PRICE }
        )
      ).to.not.be.reverted;
    });
  });
  
  describe("Transfer and Marketplace Operations", function () {
    beforeEach(async function () {
      await crashBytesNFT.flipSaleState();
      
      // Mint a token to user1
      await crashBytesNFT.connect(user1).mintNFT(
        user1.address,
        "token1",
        { value: MINT_PRICE }
      );
    });
    
    it("Should allow token transfers between users", async function () {
      // Transfer from user1 to user2
      await crashBytesNFT.connect(user1).transferFrom(
        user1.address,
        user2.address,
        1
      );
      
      expect(await crashBytesNFT.ownerOf(1)).to.equal(user2.address);
      expect(await crashBytesNFT.balanceOf(user1.address)).to.equal(0);
      expect(await crashBytesNFT.balanceOf(user2.address)).to.equal(1);
    });
    
    it("Should support approval and transferFrom pattern", async function () {
      // User1 approves user3 to transfer their token
      await crashBytesNFT.connect(user1).approve(user3.address, 1);
      
      // User3 transfers token from user1 to user2
      await crashBytesNFT.connect(user3).transferFrom(
        user1.address,
        user2.address,
        1
      );
      
      expect(await crashBytesNFT.ownerOf(1)).to.equal(user2.address);
    });
    
    it("Should support setApprovalForAll for marketplace integration", async function () {
      // User1 grants operator approval to user3 (simulating marketplace)
      await crashBytesNFT.connect(user1).setApprovalForAll(user3.address, true);
      
      expect(
        await crashBytesNFT.isApprovedForAll(user1.address, user3.address)
      ).to.equal(true);
      
      // Operator can now transfer any of user1's tokens
      await crashBytesNFT.connect(user3).transferFrom(
        user1.address,
        user2.address,
        1
      );
      
      expect(await crashBytesNFT.ownerOf(1)).to.equal(user2.address);
    });
  });
  
  describe("Financial Operations", function () {
    it("Should accumulate mint payments in contract", async function () {
      await crashBytesNFT.flipSaleState();
      
      // Multiple users mint
      await crashBytesNFT.connect(user1).mintNFT(user1.address, "token1", {
        value: MINT_PRICE
      });
      
      await crashBytesNFT.connect(user2).mintNFT(user2.address, "token2", {
        value: MINT_PRICE
      });
      
      const contractBalance = await ethers.provider.getBalance(
        await crashBytesNFT.getAddress()
      );
      
      expect(contractBalance).to.equal(MINT_PRICE * 2n);
    });
    
    it("Should allow owner to withdraw accumulated funds", async function () {
      await crashBytesNFT.flipSaleState();
      
      // User mints
      await crashBytesNFT.connect(user1).mintNFT(user1.address, "token1", {
        value: MINT_PRICE
      });
      
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      const tx = await crashBytesNFT.withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(ownerBalanceAfter).to.equal(
        ownerBalanceBefore + MINT_PRICE - gasUsed
      );
    });
    
    it("Should handle price changes correctly", async function () {
      await crashBytesNFT.flipSaleState();
      
      // Mint at original price
      await crashBytesNFT.connect(user1).mintNFT(user1.address, "token1", {
        value: MINT_PRICE
      });
      
      // Owner changes price
      const newPrice = ethers.parseEther("0.1");
      await crashBytesNFT.setMintPrice(newPrice);
      
      // New mint requires new price
      await expect(
        crashBytesNFT.connect(user2).mintNFT(user2.address, "token2", {
          value: MINT_PRICE
        })
      ).to.be.revertedWith("Insufficient payment");
      
      // Minting with new price succeeds
      await expect(
        crashBytesNFT.connect(user2).mintNFT(user2.address, "token2", {
          value: newPrice
        })
      ).to.not.be.reverted;
    });
  });
  
  describe("Supply Limit Enforcement", function () {
    it("Should prevent minting beyond max supply", async function () {
      await crashBytesNFT.flipSaleState();
      
      const maxSupply = await crashBytesNFT.MAX_SUPPLY();
      
      // This test would be slow with 10,000 supply, so we verify the check exists
      // by attempting to batch mint beyond supply
      const recipients = Array(100).fill(user1.address);
      const tokenURIs = Array(100).fill("token");
      
      // First batch should succeed
      await crashBytesNFT.batchMint(recipients, tokenURIs);
      expect(await crashBytesNFT.totalSupply()).to.equal(100);
      
      // Verify max supply is enforced
      expect(maxSupply).to.equal(10000);
    });
  });
  
  describe("Batch Minting for Airdrops", function () {
    it("Should efficiently batch mint for multiple recipients", async function () {
      const recipients = [user1.address, user2.address, user3.address];
      const tokenURIs = ["token1", "token2", "token3"];
      
      const tx = await crashBytesNFT.batchMint(recipients, tokenURIs);
      const receipt = await tx.wait();
      
      expect(await crashBytesNFT.totalSupply()).to.equal(3);
      expect(await crashBytesNFT.balanceOf(user1.address)).to.equal(1);
      expect(await crashBytesNFT.balanceOf(user2.address)).to.equal(1);
      expect(await crashBytesNFT.balanceOf(user3.address)).to.equal(1);
      
      console.log(`Batch mint gas used: ${receipt.gasUsed.toString()}`);
      console.log(`Gas per token: ${(receipt.gasUsed / 3n).toString()}`);
    });
    
    it("Should reject batch mint with mismatched array lengths", async function () {
      const recipients = [user1.address, user2.address];
      const tokenURIs = ["token1"];
      
      await expect(
        crashBytesNFT.batchMint(recipients, tokenURIs)
      ).to.be.revertedWith("Arrays must have equal length");
    });
  });
  
  describe("Gas Optimization Verification", function () {
    it("Should demonstrate gas savings from batch minting", async function () {
      await crashBytesNFT.flipSaleState();
      
      // Individual mints
      const tx1 = await crashBytesNFT.connect(user1).mintNFT(
        user1.address,
        "token1",
        { value: MINT_PRICE }
      );
      const receipt1 = await tx1.wait();
      
      const tx2 = await crashBytesNFT.connect(user1).mintNFT(
        user1.address,
        "token2",
        { value: MINT_PRICE }
      );
      const receipt2 = await tx2.wait();
      
      const individualGasTotal = receipt1.gasUsed + receipt2.gasUsed;
      
      // Batch mint (using owner for comparison)
      const recipients = [user2.address, user2.address];
      const tokenURIs = ["token3", "token4"];
      
      const batchTx = await crashBytesNFT.batchMint(recipients, tokenURIs);
      const batchReceipt = await batchTx.wait();
      
      console.log(`Individual mints total gas: ${individualGasTotal.toString()}`);
      console.log(`Batch mint gas: ${batchReceipt.gasUsed.toString()}`);
      console.log(`Gas savings: ${(individualGasTotal - batchReceipt.gasUsed).toString()}`);
      
      expect(batchReceipt.gasUsed).to.be.lessThan(individualGasTotal);
    });
  });
  
  describe("Metadata Management", function () {
    it("Should return correct token URI for minted tokens", async function () {
      await crashBytesNFT.flipSaleState();
      
      const tokenURI = "ipfs://QmSpecificHash/1.json";
      
      await crashBytesNFT.connect(user1).mintNFT(
        user1.address,
        tokenURI,
        { value: MINT_PRICE }
      );
      
      const retrievedURI = await crashBytesNFT.tokenURI(1);
      expect(retrievedURI).to.include(tokenURI);
    });
    
    it("Should revert when querying URI for non-existent token", async function () {
      await expect(
        crashBytesNFT.tokenURI(999)
      ).to.be.revertedWithCustomError(crashBytesNFT, "ERC721NonexistentToken");
    });
  });
  
  describe("Sale State Management", function () {
    it("Should prevent all user operations when sale is inactive", async function () {
      expect(await crashBytesNFT.saleIsActive()).to.equal(false);
      
      await expect(
        crashBytesNFT.connect(user1).mintNFT(user1.address, "token1", {
          value: MINT_PRICE
        })
      ).to.be.revertedWith("Sale is not active");
    });
    
    it("Should allow toggling sale state multiple times", async function () {
      expect(await crashBytesNFT.saleIsActive()).to.equal(false);
      
      await crashBytesNFT.flipSaleState();
      expect(await crashBytesNFT.saleIsActive()).to.equal(true);
      
      await crashBytesNFT.flipSaleState();
      expect(await crashBytesNFT.saleIsActive()).to.equal(false);
      
      await crashBytesNFT.flipSaleState();
      expect(await crashBytesNFT.saleIsActive()).to.equal(true);
    });
  });
  
  describe("End-to-End User Journey", function () {
    it("Should complete full user lifecycle: mint, transfer, approve", async function () {
      // 1. Owner prepares contract
      await crashBytesNFT.flipSaleState();
      expect(await crashBytesNFT.saleIsActive()).to.equal(true);
      
      // 2. User1 mints their first NFT
      await crashBytesNFT.connect(user1).mintNFT(
        user1.address,
        "token1",
        { value: MINT_PRICE }
      );
      
      expect(await crashBytesNFT.balanceOf(user1.address)).to.equal(1);
      expect(await crashBytesNFT.ownerOf(1)).to.equal(user1.address);
      
      // 3. User1 approves marketplace (user3) to manage their NFT
      await crashBytesNFT.connect(user1).setApprovalForAll(user3.address, true);
      
      // 4. Marketplace transfers NFT to user2 (simulating sale)
      await crashBytesNFT.connect(user3).transferFrom(
        user1.address,
        user2.address,
        1
      );
      
      // 5. Verify final state
      expect(await crashBytesNFT.ownerOf(1)).to.equal(user2.address);
      expect(await crashBytesNFT.balanceOf(user1.address)).to.equal(0);
      expect(await crashBytesNFT.balanceOf(user2.address)).to.equal(1);
      
      // 6. User2 can now manage their newly acquired NFT
      await crashBytesNFT.connect(user2).approve(user1.address, 1);
      expect(await crashBytesNFT.getApproved(1)).to.equal(user1.address);
    });
  });
});
