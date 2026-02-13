// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CrashBytesNFT
 * @dev ERC-721 NFT contract with minting capabilities, supply limits, and access controls
 * @author Michael Eakins - CrashBytes
 */
contract CrashBytesNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    
    // Maximum supply of NFTs
    uint256 public constant MAX_SUPPLY = 10000;
    
    // Mint price in wei (0.05 ETH)
    uint256 public mintPrice = 0.05 ether;
    
    // Base URI for token metadata
    string private _baseTokenURI;
    
    // Mapping to track minted tokens per address
    mapping(address => uint256) public mintedPerAddress;
    
    // Maximum mints per address
    uint256 public constant MAX_PER_ADDRESS = 5;
    
    // Sale state
    bool public saleIsActive = false;
    
    /**
     * @dev Constructor initializes the NFT collection
     * @param name Token name
     * @param symbol Token symbol
     * @param baseURI Base URI for token metadata
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Mint a new NFT
     * @param recipient Address to receive the NFT
     * @param tokenURI Metadata URI for the token
     * @return newTokenId The ID of the newly minted token
     */
    function mintNFT(address recipient, string memory tokenURI)
        public
        payable
        returns (uint256)
    {
        require(saleIsActive, "Sale is not active");
        require(_tokenIds.current() < MAX_SUPPLY, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(
            mintedPerAddress[recipient] < MAX_PER_ADDRESS,
            "Max mints per address reached"
        );
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        mintedPerAddress[recipient]++;
        
        return newTokenId;
    }
    
    /**
     * @dev Batch mint multiple NFTs (owner only)
     * @param recipients Array of addresses to receive NFTs
     * @param tokenURIs Array of metadata URIs
     */
    function batchMint(
        address[] memory recipients,
        string[] memory tokenURIs
    ) public onlyOwner {
        require(
            recipients.length == tokenURIs.length,
            "Arrays must have equal length"
        );
        require(
            _tokenIds.current() + recipients.length <= MAX_SUPPLY,
            "Would exceed max supply"
        );
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();
            
            _safeMint(recipients[i], newTokenId);
            _setTokenURI(newTokenId, tokenURIs[i]);
        }
    }
    
    /**
     * @dev Toggle sale state
     */
    function flipSaleState() public onlyOwner {
        saleIsActive = !saleIsActive;
    }
    
    /**
     * @dev Update mint price
     * @param newPrice New price in wei
     */
    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
    }
    
    /**
     * @dev Update base URI
     * @param baseURI New base URI
     */
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Withdraw contract balance
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Get total supply
     * @return Current total supply
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
    
    /**
     * @dev Override base URI
     * @return Base URI string
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Override tokenURI to use both base URI and token-specific URI
     * @param tokenId Token ID
     * @return Token URI string
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Required override for OpenZeppelin contracts
     * @param tokenId Token ID
     */
    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }
    
    /**
     * @dev Required override for OpenZeppelin contracts
     * @param interfaceId Interface ID to check
     * @return Whether the interface is supported
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}