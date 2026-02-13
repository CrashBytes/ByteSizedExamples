#!/bin/bash

# Resize all screenshot images to uniform size
# Requires ImageMagick (install with: brew install imagemagick)

ASSETS_DIR="/Users/blackholesoftware/github/whitelabel-app/assets"
TARGET_WIDTH=800
TARGET_HEIGHT=600

echo "Resizing all screenshots to ${TARGET_WIDTH}x${TARGET_HEIGHT}..."
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed"
    echo "Install with: brew install imagemagick"
    exit 1
fi

# Array of screenshot files
screenshots=("acme.png" "fitzone.png" "tastybites.png" "shopsmart.png" "homefinder.png" "medicare.png" "techstartup.png")

for screenshot in "${screenshots[@]}"
do
    filepath="${ASSETS_DIR}/${screenshot}"
    
    if [ -f "$filepath" ]; then
        echo "Resizing: $screenshot"
        
        # Backup original
        cp "$filepath" "${filepath}.backup"
        
        # Resize to target dimensions (maintaining aspect ratio, adding padding if needed)
        convert "$filepath" \
            -resize "${TARGET_WIDTH}x${TARGET_HEIGHT}" \
            -gravity center \
            -background white \
            -extent "${TARGET_WIDTH}x${TARGET_HEIGHT}" \
            "$filepath"
        
        echo "  ✓ Resized and backed up original"
    else
        echo "  ✗ Not found: $screenshot"
    fi
    echo ""
done

echo "✅ All screenshots resized!"
echo ""
echo "Original files backed up with .backup extension"
echo "If you want to restore originals:"
echo "  cd $ASSETS_DIR && for f in *.backup; do mv \"\$f\" \"\${f%.backup}\"; done"
