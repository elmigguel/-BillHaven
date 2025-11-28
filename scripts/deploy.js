import hre from "hardhat";

async function main() {
  console.log("Deploying BillHavenEscrow...");

  // Fee wallet address (jouw fee wallet)
  const FEE_WALLET = "0x596b95782d98295283c5d72142e477d92549cde3";

  const BillHavenEscrow = await hre.ethers.getContractFactory("BillHavenEscrow");
  const escrow = await BillHavenEscrow.deploy(FEE_WALLET);

  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log(`BillHavenEscrow deployed to: ${address}`);
  console.log(`Fee wallet: ${FEE_WALLET}`);
  console.log(`Network: ${hre.network.name}`);

  // Log verification command
  console.log("\nTo verify on Polygonscan:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${address} "${FEE_WALLET}"`);

  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
