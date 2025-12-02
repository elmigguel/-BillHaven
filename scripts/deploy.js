import hre from "hardhat";

async function main() {
  console.log("========================================");
  console.log("  Deploying BillHavenEscrowV4 (SECURE)");
  console.log("========================================\n");

  // Fee wallet address (jouw fee wallet)
  const FEE_WALLET = "0x596b95782d98295283c5d72142e477d92549cde3";

  // Oracle wallet (backend wallet that signs payment verifications)
  // This should be a secure wallet controlled by your backend server
  // V4 Oracle: New secure wallet generated 2025-12-02
  const ORACLE_WALLET = process.env.ORACLE_WALLET_ADDRESS || "0x1Cd9cb2A9afa7Fc04610dd2c023272321F104586";

  console.log("Configuration:");
  console.log(`  Fee Wallet: ${FEE_WALLET}`);
  console.log(`  Oracle Wallet: ${ORACLE_WALLET}`);
  console.log(`  Network: ${hre.network.name}\n`);

  // Deploy V4 contract
  const BillHavenEscrowV4 = await hre.ethers.getContractFactory("BillHavenEscrowV4");
  const escrow = await BillHavenEscrowV4.deploy(FEE_WALLET);

  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log(`\n✅ BillHavenEscrowV4 deployed to: ${address}`);

  // Add Oracle role
  console.log("\nSetting up Oracle...");
  const addOracleTx = await escrow.addOracle(ORACLE_WALLET);
  await addOracleTx.wait();
  console.log(`✅ Oracle added: ${ORACLE_WALLET}`);

  // Get chain ID for frontend config
  const network = await hre.ethers.provider.getNetwork();
  const chainId = network.chainId;

  console.log("\n========================================");
  console.log("  DEPLOYMENT COMPLETE - V4 SECURITY");
  console.log("========================================");
  console.log(`Contract: ${address}`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Fee Wallet: ${FEE_WALLET}`);
  console.log(`Oracle: ${ORACLE_WALLET}`);
  console.log("\n⚠️  IMPORTANT: Update these files with new contract address:");
  console.log("  1. src/config/contracts.js");
  console.log("  2. server/index.js (CONTRACT_ADDRESS)");
  console.log("  3. .env (if used)");

  // Log verification command
  console.log("\n🔍 To verify on Polygonscan:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${address} "${FEE_WALLET}"`);

  // V4 Security Features summary
  console.log("\n🔒 V4 SECURITY FEATURES:");
  console.log("  - Oracle verification REQUIRED for all releases");
  console.log("  - makerConfirmAndRelease BLOCKED (no bypass)");
  console.log("  - 24-hour minimum security delay");
  console.log("  - Cross-chain replay protection (chainId in signature)");
  console.log("  - 5-minute signature validity window");
  console.log("  - Signature replay tracking");

  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
