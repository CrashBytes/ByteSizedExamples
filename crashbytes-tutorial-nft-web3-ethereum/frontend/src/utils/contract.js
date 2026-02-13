import { ethers } from 'ethers';
import contractABI from '../contracts/CrashBytesNFT.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

export async function getContract(signerOrProvider) {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured');
  }
  
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    contractABI.abi,
    signerOrProvider
  );
}

export async function getMintPrice(provider) {
  const contract = await getContract(provider);
  return await contract.mintPrice();
}

export async function getTotalSupply(provider) {
  const contract = await getContract(provider);
  return await contract.totalSupply();
}

export async function isSaleActive(provider) {
  const contract = await getContract(provider);
  return await contract.saleIsActive();
}

export async function getMaxSupply(provider) {
  const contract = await getContract(provider);
  return await contract.MAX_SUPPLY();
}

export async function getBalanceOf(provider, address) {
  const contract = await getContract(provider);
  return await contract.balanceOf(address);
}

export async function getOwnerOf(provider, tokenId) {
  const contract = await getContract(provider);
  return await contract.ownerOf(tokenId);
}

export async function getTokenURI(provider, tokenId) {
  const contract = await getContract(provider);
  return await contract.tokenURI(tokenId);
}

export async function mintNFT(signer, recipient, tokenURI, mintPrice) {
  const contract = await getContract(signer);
  const tx = await contract.mintNFT(recipient, tokenURI, {
    value: mintPrice
  });
  return await tx.wait();
}

export function formatAddress(address) {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function formatEther(wei) {
  return ethers.formatEther(wei);
}

export function parseEther(ether) {
  return ethers.parseEther(ether);
}
