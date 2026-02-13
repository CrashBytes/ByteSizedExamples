const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export function getIPFSUrl(ipfsURI) {
  if (!ipfsURI) return null;
  
  if (ipfsURI.startsWith('ipfs://')) {
    const cid = ipfsURI.replace('ipfs://', '');
    return `${IPFS_GATEWAY}${cid}`;
  }
  
  if (ipfsURI.startsWith('http')) {
    return ipfsURI;
  }
  
  return `${IPFS_GATEWAY}${ipfsURI}`;
}

export async function fetchIPFSMetadata(ipfsURI) {
  const url = getIPFSUrl(ipfsURI);
  
  if (!url) {
    throw new Error('Invalid IPFS URI');
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error('Error fetching IPFS metadata:', error);
    throw error;
  }
}

export function parseIPFSUri(uri) {
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', '');
  }
  return uri;
}

export function createIPFSUri(cid) {
  return `ipfs://${cid}`;
}
