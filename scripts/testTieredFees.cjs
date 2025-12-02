/**
 * Test Tiered Fee Calculation - Verification Script
 *
 * This script demonstrates the new calculateTieredFee() view function
 * and verifies it matches the frontend logic.
 */

const hre = require("hardhat");

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  BillHaven V3 - Tiered Fee Verification Script");
  console.log("=".repeat(70) + "\n");

  // Get signers
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log("");

  // Deploy contract for testing
  console.log("Deploying BillHavenEscrowV3 for testing...");
  const BillHavenEscrowV3 = await hre.ethers.getContractFactory("BillHavenEscrowV3");
  const contract = await BillHavenEscrowV3.deploy(deployer.address);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("Contract deployed at:", contractAddress);
  console.log("");

  // Test cases covering all tiers
  const testCases = [
    // Tier 1: < $10K (4.4% or 2.2% with affiliate)
    { amount: 500, desc: "Small ($500)", affiliate: false, expectedBP: 440, expectedFee: 22 },
    { amount: 500, desc: "Small ($500) with affiliate", affiliate: true, expectedBP: 220, expectedFee: 11 },
    { amount: 5000, desc: "Medium-Small ($5,000)", affiliate: false, expectedBP: 440, expectedFee: 220 },
    { amount: 5000, desc: "Medium-Small ($5,000) with affiliate", affiliate: true, expectedBP: 220, expectedFee: 110 },
    { amount: 9999, desc: "Just below $10K", affiliate: false, expectedBP: 440, expectedFee: 439.956 },

    // Tier 2: $10K - $20K (3.5%)
    { amount: 10000, desc: "Tier 2 Start ($10,000)", affiliate: false, expectedBP: 350, expectedFee: 350 },
    { amount: 15000, desc: "Tier 2 Mid ($15,000)", affiliate: false, expectedBP: 350, expectedFee: 525 },
    { amount: 19999, desc: "Tier 2 Max ($19,999)", affiliate: false, expectedBP: 350, expectedFee: 699.965 },

    // Tier 3: $20K - $50K (2.8%)
    { amount: 20000, desc: "Tier 3 Start ($20,000)", affiliate: false, expectedBP: 280, expectedFee: 560 },
    { amount: 35000, desc: "Tier 3 Mid ($35,000)", affiliate: false, expectedBP: 280, expectedFee: 980 },
    { amount: 49999, desc: "Tier 3 Max ($49,999)", affiliate: false, expectedBP: 280, expectedFee: 1399.972 },

    // Tier 4: $50K - $500K (1.7%)
    { amount: 50000, desc: "Tier 4 Start ($50,000)", affiliate: false, expectedBP: 170, expectedFee: 850 },
    { amount: 100000, desc: "Tier 4 Mid ($100,000)", affiliate: false, expectedBP: 170, expectedFee: 1700 },
    { amount: 499999, desc: "Tier 4 Max ($499,999)", affiliate: false, expectedBP: 170, expectedFee: 8499.983 },

    // Tier 5: $500K - $1M (1.2%)
    { amount: 500000, desc: "Tier 5 Start ($500,000)", affiliate: false, expectedBP: 120, expectedFee: 6000 },
    { amount: 750000, desc: "Tier 5 Mid ($750,000)", affiliate: false, expectedBP: 120, expectedFee: 9000 },
    { amount: 999999, desc: "Tier 5 Max ($999,999)", affiliate: false, expectedBP: 120, expectedFee: 11999.988 },

    // Tier 6: > $1M (0.8%)
    { amount: 1000000, desc: "Tier 6 Start ($1,000,000)", affiliate: false, expectedBP: 80, expectedFee: 8000 },
    { amount: 2000000, desc: "Whale ($2,000,000)", affiliate: false, expectedBP: 80, expectedFee: 16000 },
    { amount: 10000000, desc: "Ultra Whale ($10,000,000)", affiliate: false, expectedBP: 80, expectedFee: 80000 },
  ];

  console.log("=".repeat(70));
  console.log("Testing calculateTieredFee() View Function");
  console.log("=".repeat(70));
  console.log("");

  let allPassed = true;

  for (const test of testCases) {
    // Convert USD to cents (contract expects cents)
    const fiatAmountInCents = BigInt(test.amount * 100);

    // Call contract view function
    const [basisPoints, feeAmount] = await contract.calculateTieredFee(
      fiatAmountInCents,
      test.affiliate
    );

    // Convert fee amount back to dollars (from cents)
    const feeInDollars = Number(feeAmount) / 100;

    // Check if results match expected
    const bpMatch = Number(basisPoints) === test.expectedBP;
    const feeMatch = Math.abs(feeInDollars - test.expectedFee) < 0.01; // Allow 1 cent rounding
    const passed = bpMatch && feeMatch;

    if (!passed) allPassed = false;

    // Display result
    const status = passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} | ${test.desc}`);
    console.log(`       Amount:   $${test.amount.toLocaleString()}`);
    console.log(`       Expected: ${test.expectedBP} bp (${(test.expectedBP / 100).toFixed(1)}%) = $${test.expectedFee.toFixed(2)} fee`);
    console.log(`       Got:      ${basisPoints} bp (${(Number(basisPoints) / 100).toFixed(1)}%) = $${feeInDollars.toFixed(2)} fee`);
    console.log(`       Payout:   $${(test.amount - feeInDollars).toLocaleString()}`);
    console.log("");
  }

  console.log("=".repeat(70));
  if (allPassed) {
    console.log("✅ ALL TESTS PASSED - Tiered fee calculation is correct!");
  } else {
    console.log("❌ SOME TESTS FAILED - Please review the results above");
  }
  console.log("=".repeat(70));
  console.log("");

  // Comparison table
  console.log("=".repeat(70));
  console.log("Tier Comparison: Old Flat Fee (4.4%) vs. New Tiered Fees");
  console.log("=".repeat(70));
  console.log("");
  console.log("Amount        | Old Fee  | New Fee  | Savings   | New %");
  console.log("-".repeat(70));

  const comparisons = [
    { amount: 500 },
    { amount: 5000 },
    { amount: 15000 },
    { amount: 35000 },
    { amount: 100000 },
    { amount: 750000 },
    { amount: 2000000 },
  ];

  for (const comp of comparisons) {
    const oldFee = comp.amount * 0.044;
    const [basisPoints, feeAmount] = await contract.calculateTieredFee(
      BigInt(comp.amount * 100),
      false
    );
    const newFee = Number(feeAmount) / 100;
    const savings = oldFee - newFee;
    const savingsPercent = (savings / oldFee) * 100;
    const newPercent = (Number(basisPoints) / 100).toFixed(1);

    console.log(
      `$${comp.amount.toLocaleString().padEnd(11)} | ` +
      `$${oldFee.toFixed(0).padEnd(7)} | ` +
      `$${newFee.toFixed(0).padEnd(7)} | ` +
      `$${savings.toFixed(0).padEnd(8)} | ` +
      `${newPercent}%`
    );
  }

  console.log("");
  console.log("=".repeat(70));
  console.log("Key Insights:");
  console.log("=".repeat(70));
  console.log("• Small transactions (<$10K): No change (4.4%)");
  console.log("• Medium transactions ($10K-$50K): 20-36% savings");
  console.log("• Large transactions ($50K+): 61-82% savings");
  console.log("• Whale transactions ($1M+): 82% savings ($88K → $16K on $2M)");
  console.log("• Affiliate discount: 50% off for <$10K tier only");
  console.log("=".repeat(70));
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
