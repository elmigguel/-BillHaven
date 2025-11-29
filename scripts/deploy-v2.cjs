const hre = require("hardhat");

// Stablecoin addresses per network
const STABLECOINS = {
  // Polygon Mainnet
  137: {
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
  },
  // Polygon Amoy Testnet (test tokens may not exist)
  80002: {
    USDT: null,
    USDC: null
  },
  // Ethereum Mainnet
  1: {
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  },
  // BSC Mainnet
  56: {
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"
  },
  // Arbitrum One
  42161: {
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
  },
  // Optimism
  10: {
    USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    USDC: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607"
  },
  // Base
  8453: {
    USDT: null, // USDT not on Base
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  }
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("=".repeat(60));
  console.log("BillHaven Escrow V2 Deployment");
  console.log("=".repeat(60));
  console.log(`Network: ${hre.network.name}`);
  console.log(`Chain ID: ${hre.network.config.chainId}`);
  console.log(`Deployer: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH/MATIC/BNB`);
  console.log("=".repeat(60));

  // Fee wallet address - read from environment variable with fallback
  const FEE_WALLET = process.env.FEE_WALLET || "0x596b95782d98295283c5d72142e477d92549cde3";

  if (!process.env.FEE_WALLET) {
    console.log("⚠️  Warning: FEE_WALLET not set in environment, using default");
  }

  console.log(`Fee Wallet: ${FEE_WALLET}`);

  // Deploy contract
  console.log("\nDeploying BillHavenEscrowV2...");
  const BillHavenEscrowV2 = await hre.ethers.getContractFactory("BillHavenEscrowV2");
  const escrow = await BillHavenEscrowV2.deploy(FEE_WALLET);

  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log(`\n✅ BillHavenEscrowV2 deployed to: ${address}`);

  // Add supported stablecoins if on mainnet
  const chainId = hre.network.config.chainId;
  const stablecoins = STABLECOINS[chainId];

  if (stablecoins) {
    console.log("\nAdding supported stablecoins...");

    if (stablecoins.USDT) {
      console.log(`Adding USDT: ${stablecoins.USDT}`);
      const tx1 = await escrow.addSupportedToken(stablecoins.USDT);
      await tx1.wait();
      console.log("✅ USDT added");
    }

    if (stablecoins.USDC) {
      console.log(`Adding USDC: ${stablecoins.USDC}`);
      const tx2 = await escrow.addSupportedToken(stablecoins.USDC);
      await tx2.wait();
      console.log("✅ USDC added");
    }
  }

  // Verification info
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log(`Contract Address: ${address}`);
  console.log(`Fee Wallet: ${FEE_WALLET}`);
  console.log(`Chain ID: ${chainId}`);

  // Block explorer URLs
  const explorers = {
    137: "https://polygonscan.com",
    80002: "https://amoy.polygonscan.com",
    1: "https://etherscan.io",
    56: "https://bscscan.com",
    42161: "https://arbiscan.io",
    10: "https://optimistic.etherscan.io",
    8453: "https://basescan.org"
  };

  if (explorers[chainId]) {
    console.log(`\nView on Explorer:`);
    console.log(`${explorers[chainId]}/address/${address}`);
  }

  console.log("\n📝 To verify on block explorer:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${address} "${FEE_WALLET}"`);

  console.log("\n📋 Update src/config/contracts.js with:");
  console.log(`${chainId}: "${address}",`);

  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
