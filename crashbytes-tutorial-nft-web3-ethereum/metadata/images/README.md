# NFT Images

Place your NFT artwork images in this directory. Supported formats:

- PNG
- JPG/JPEG
- GIF
- WebP

## File Naming Convention

Name your images sequentially:
- 1.png
- 2.png
- 3.png
- etc.

Or use descriptive names:
- rare-robot-1.png
- common-spaceship-5.png

## Image Specifications

Recommended specifications for NFT artwork:

- **Resolution**: 1000x1000 pixels minimum
- **Aspect Ratio**: 1:1 (square) for best marketplace display
- **File Size**: Under 10MB per image
- **Format**: PNG with transparency for best quality

## Upload Process

Images in this directory will be uploaded to IPFS using the upload-metadata.js script:

```bash
node scripts/upload-metadata.js
```

The script will:
1. Upload each image to IPFS via Pinata
2. Generate metadata JSON referencing the image CID
3. Upload metadata JSON to IPFS
4. Return metadata URIs for minting
