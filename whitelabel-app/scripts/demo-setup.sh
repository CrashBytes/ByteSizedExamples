#!/bin/bash

# White Label App Demo - Generate All Client Assets
# This script creates placeholder assets for all demo clients

echo "🎨 Generating assets for all demo clients..."
echo ""

# Array of all demo clients
clients=("fitzone" "tastybites" "shopsmart" "homefinder" "medicare")

for client in "${clients[@]}"
do
  echo "📱 Generating assets for: $client"
  npm run generate-assets "$client"
  echo ""
done

echo "✅ All assets generated!"
echo ""
echo "🚀 Test each client with:"
echo "  CLIENT=fitzone npm start      # Fitness (Green/Orange)"
echo "  CLIENT=tastybites npm start   # Restaurant (Red/Yellow)"
echo "  CLIENT=shopsmart npm start    # E-commerce (Teal/Pink)"
echo "  CLIENT=homefinder npm start   # Real Estate (Navy/Gold)"
echo "  CLIENT=medicare npm start     # Healthcare (Blue/Green)"
echo ""
