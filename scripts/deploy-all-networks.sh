#!/bin/bash

#######################################
# BillHaven Multi-Chain Deployment Script
# Deploys BillHavenEscrowV2 to all mainnets
#######################################

set -e  # Exit on error

echo ""
echo "=========================================="
echo "   BillHaven Multi-Chain Deployment"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for required environment variables
echo "Checking environment variables..."

if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
  echo -e "${RED}ERROR: DEPLOYER_PRIVATE_KEY not set${NC}"
  echo "Please set it in .env file or export it:"
  echo "  export DEPLOYER_PRIVATE_KEY='your_private_key_here'"
  exit 1
fi

# Use default fee wallet or environment variable
if [ -z "$FEE_WALLET" ]; then
  export FEE_WALLET="0x596b95782d98295283c5d72142e477d92549cde3"
  echo -e "${YELLOW}Using default FEE_WALLET: $FEE_WALLET${NC}"
else
  echo -e "${GREEN}Using FEE_WALLET from environment: $FEE_WALLET${NC}"
fi

echo ""
echo -e "${GREEN}Environment checks passed!${NC}"
echo ""

# Initialize JSON file for deployed addresses
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
JSON_FILE="deployed-addresses-${TIMESTAMP}.json"

echo "{" > "$JSON_FILE"
echo "  \"deployment_timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"," >> "$JSON_FILE"
echo "  \"fee_wallet\": \"$FEE_WALLET\"," >> "$JSON_FILE"
echo "  \"networks\": {" >> "$JSON_FILE"

# Network configurations (ordered by deployment cost - cheapest first)
declare -A networks
networks=(
  ["arbitrum"]="42161|Arbitrum One (L2)|~\$0.10-0.50"
  ["optimism"]="10|Optimism (L2)|~\$0.10-0.50"
  ["base"]="8453|Base (L2)|~\$0.10-0.50"
  ["polygon"]="137|Polygon|~\$0.05-0.20"
  ["bsc"]="56|BSC|~\$0.20-1.00"
)

# Deploy to L2s and cheaper networks first (Base is cheapest, then L2s, then others)
cheap_networks=("base" "arbitrum" "optimism" "polygon" "bsc")

echo "=========================================="
echo "Deploying to low-cost networks first"
echo "=========================================="
echo ""

deployed_count=0

for network in "${cheap_networks[@]}"; do
  IFS='|' read -r chain_id network_name est_cost <<< "${networks[$network]}"

  echo -e "${BLUE}=========================================="
  echo -e "Network: ${network_name}"
  echo -e "Chain ID: ${chain_id}"
  echo -e "Estimated Cost: ${est_cost}"
  echo -e "==========================================${NC}"
  echo ""

  read -p "Deploy to $network_name? [Y/n]: " deploy
  deploy=${deploy:-Y}  # Default to Y if empty

  if [[ "$deploy" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deploying to $network...${NC}"

    # Run deployment
    if npx hardhat run scripts/deploy-v2.cjs --network "$network"; then
      echo ""
      echo -e "${GREEN}Deployment successful!${NC}"
      echo ""

      # Ask for deployed address
      read -p "Enter deployed contract address for $network: " addr

      # Validate address format (basic check)
      if [[ $addr =~ ^0x[a-fA-F0-9]{40}$ ]]; then
        # Add to JSON file
        if [ $deployed_count -gt 0 ]; then
          echo "," >> "$JSON_FILE"
        fi
        echo -n "    \"$network\": {" >> "$JSON_FILE"
        echo -n " \"address\": \"$addr\", \"chainId\": $chain_id, \"name\": \"$network_name\" }" >> "$JSON_FILE"

        deployed_count=$((deployed_count + 1))

        echo -e "${GREEN}✅ Saved: $network -> $addr${NC}"
        echo ""
      else
        echo -e "${RED}Invalid address format. Skipping...${NC}"
        echo ""
      fi
    else
      echo -e "${RED}Deployment failed!${NC}"
      echo ""
      read -p "Continue to next network? [y/N]: " continue
      if [[ ! "$continue" =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
      fi
    fi
  else
    echo -e "${YELLOW}Skipping $network_name${NC}"
    echo ""
  fi
done

# Ethereum mainnet (expensive - ask with strong warning)
echo ""
echo -e "${RED}=========================================="
echo -e "⚠️  WARNING: ETHEREUM MAINNET DEPLOYMENT"
echo -e "==========================================${NC}"
echo -e "${YELLOW}Network: Ethereum Mainnet"
echo -e "Chain ID: 1"
echo -e "Estimated Cost: ${RED}\$30-100 (depending on gas)${NC}"
echo ""
echo -e "${RED}This is EXPENSIVE! Only deploy if you need Ethereum mainnet.${NC}"
echo -e "${RED}Most users can skip this and use L2s (Arbitrum, Optimism, Base).${NC}"
echo ""

read -p "Deploy to Ethereum mainnet? [y/N]: " deploy_eth
deploy_eth=${deploy_eth:-N}

if [[ "$deploy_eth" =~ ^[Yy]$ ]]; then
  echo ""
  read -p "Are you SURE? This will cost real money! [y/N]: " confirm_eth

  if [[ "$confirm_eth" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deploying to Ethereum mainnet...${NC}"

    if npx hardhat run scripts/deploy-v2.cjs --network ethereum; then
      echo ""
      echo -e "${GREEN}Deployment successful!${NC}"
      echo ""

      read -p "Enter deployed contract address for ethereum: " addr

      if [[ $addr =~ ^0x[a-fA-F0-9]{40}$ ]]; then
        if [ $deployed_count -gt 0 ]; then
          echo "," >> "$JSON_FILE"
        fi
        echo -n "    \"ethereum\": {" >> "$JSON_FILE"
        echo -n " \"address\": \"$addr\", \"chainId\": 1, \"name\": \"Ethereum Mainnet\" }" >> "$JSON_FILE"

        deployed_count=$((deployed_count + 1))

        echo -e "${GREEN}✅ Saved: ethereum -> $addr${NC}"
      else
        echo -e "${RED}Invalid address format.${NC}"
      fi
    else
      echo -e "${RED}Deployment failed!${NC}"
    fi
  else
    echo -e "${YELLOW}Ethereum deployment cancelled.${NC}"
  fi
else
  echo -e "${YELLOW}Skipping Ethereum mainnet.${NC}"
fi

# Close JSON file
echo "" >> "$JSON_FILE"
echo "  }" >> "$JSON_FILE"
echo "}" >> "$JSON_FILE"

# Final summary
echo ""
echo "=========================================="
echo "         DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo -e "${GREEN}Deployed to $deployed_count network(s)${NC}"
echo ""
echo "Addresses saved to: ${GREEN}$JSON_FILE${NC}"
echo ""

if [ $deployed_count -gt 0 ]; then
  echo "📋 Deployed addresses:"
  echo ""
  cat "$JSON_FILE" | grep -E "\"address\"|\"name\"" || cat "$JSON_FILE"
  echo ""

  echo "📝 Next steps:"
  echo "1. Verify contracts on block explorers:"
  echo "   npx hardhat verify --network <network> <address> \"$FEE_WALLET\""
  echo ""
  echo "2. Update src/config/contracts.js with deployed addresses"
  echo ""
  echo "3. Test each network with a small transaction"
  echo ""
  echo "4. Update frontend to show all available networks"
  echo ""
fi

echo -e "${GREEN}All done! 🚀${NC}"
echo ""
