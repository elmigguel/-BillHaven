/**
 * BillHaven Escrow V3 Deployment Script
 *
 * Features deployed:
 * - Multi-confirmation pattern (Payer + Oracle/Maker)
 * - Hold period enforcement (24h iDEAL, 3d SEPA, 5d ACH)
 * - Payment method risk classification (blocks PayPal G&S, Credit Cards)
 * - Velocity limits for fraud prevention
 * - Oracle signature verification for payment webhooks
 *
 * Usage:
 *   npx hardhat run scripts/deployV3.cjs --network polygonAmoy
 *   npx hardhat run scripts/deployV3.cjs --network polygon
 */

const hre = require("hardhat");

async function main() {
    console.log("\n========================================");
    console.log("  BILLHAVEN ESCROW V3 DEPLOYMENT");
    console.log("========================================\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Check balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "native tokens\n");

    if (balance < hre.ethers.parseEther("0.1")) {
        console.log("WARNING: Low balance! May not have enough for deployment + setup transactions.\n");
    }

    // Fee wallet configuration
    const FEE_WALLET = "0x596b95782d98295283c5d72142e477d92549cde3";
    console.log("Fee Wallet:", FEE_WALLET);

    // Deploy V3 Escrow
    console.log("\n1. Deploying BillHavenEscrowV3...");
    const EscrowV3 = await hre.ethers.getContractFactory("BillHavenEscrowV3");
    const escrowV3 = await EscrowV3.deploy(FEE_WALLET);
    await escrowV3.waitForDeployment();

    const escrowAddress = await escrowV3.getAddress();
    console.log("   BillHavenEscrowV3 deployed to:", escrowAddress);

    // Get network info
    const network = await hre.ethers.provider.getNetwork();
    const chainId = Number(network.chainId);
    console.log("\n   Network:", network.name || "unknown");
    console.log("   Chain ID:", chainId);

    // Configure supported tokens based on network
    console.log("\n2. Configuring supported tokens...");

    const TOKENS = {
        // Polygon Mainnet (137)
        137: {
            USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
            USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // Native USDC
            WBTC: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6"
        },
        // Polygon Amoy Testnet (80002)
        80002: {
            USDT: "0x3870419Ba2BBf0127060bCB37f69A1b1C090992B", // Test USDT
            USDC: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582"  // Test USDC
        },
        // Ethereum Mainnet (1)
        1: {
            USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
        },
        // Arbitrum One (42161)
        42161: {
            USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
            USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Native USDC
            WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f"
        },
        // BSC Mainnet (56)
        56: {
            USDT: "0x55d398326f99059fF775485246999027B3197955",
            USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
            BTCB: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c"
        }
    };

    if (TOKENS[chainId]) {
        const tokens = TOKENS[chainId];
        for (const [symbol, address] of Object.entries(tokens)) {
            try {
                const tx = await escrowV3.addSupportedToken(address);
                await tx.wait();
                console.log(`   Added ${symbol}: ${address}`);
            } catch (err) {
                console.log(`   Failed to add ${symbol}: ${err.message}`);
            }
        }
    } else {
        console.log("   No predefined tokens for this network");
    }

    // Add deployer as oracle (for testing)
    console.log("\n3. Setting up roles...");
    try {
        const oracleTx = await escrowV3.addOracle(deployer.address);
        await oracleTx.wait();
        console.log("   Added deployer as oracle (for testing)");
    } catch (err) {
        console.log("   Failed to add oracle:", err.message);
    }

    // Verify deployment
    console.log("\n4. Verifying deployment...");
    console.log("   Platform Fee:", (await escrowV3.platformFeePercent()).toString(), "basis points (4.4%)");
    console.log("   Fee Wallet:", await escrowV3.feeWallet());

    // Hold periods
    console.log("\n   Hold Periods:");
    const methods = [
        { id: 0, name: "CRYPTO" },
        { id: 1, name: "CASH_DEPOSIT" },
        { id: 2, name: "WIRE_TRANSFER" },
        { id: 3, name: "IDEAL" },
        { id: 4, name: "SEPA" },
        { id: 5, name: "BANK_TRANSFER" }
    ];

    for (const method of methods) {
        const period = await escrowV3.getHoldPeriod(method.id);
        const hours = Number(period) / 3600;
        console.log(`   - ${method.name}: ${hours} hours (${Number(period)} seconds)`);
    }

    // Blocked methods
    console.log("\n   Blocked Methods:");
    console.log("   - PayPal G&S:", await escrowV3.isMethodBlocked(7) ? "BLOCKED" : "allowed");
    console.log("   - Credit Card:", await escrowV3.isMethodBlocked(8) ? "BLOCKED" : "allowed");

    // Summary
    console.log("\n========================================");
    console.log("  DEPLOYMENT SUMMARY");
    console.log("========================================");
    console.log("\nContract Address:", escrowAddress);
    console.log("Fee Wallet:", FEE_WALLET);
    console.log("Chain ID:", chainId);
    console.log("\nVerification Command:");
    console.log(`npx hardhat verify --network ${network.name || 'polygon'} ${escrowAddress} "${FEE_WALLET}"`);

    // Save deployment info
    const deploymentInfo = {
        contract: "BillHavenEscrowV3",
        address: escrowAddress,
        feeWallet: FEE_WALLET,
        chainId: chainId,
        network: network.name || "unknown",
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        features: [
            "Multi-confirmation pattern",
            "Hold period enforcement",
            "Payment method risk classification",
            "Velocity limits",
            "Oracle signature verification"
        ]
    };

    console.log("\nDeployment Info (save this!):");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Update contracts.js instruction
    console.log("\n========================================");
    console.log("  NEXT STEPS");
    console.log("========================================");
    console.log("\n1. Update src/config/contracts.js:");
    console.log(`   ESCROW_V3_ADDRESSES: {`);
    console.log(`     ${chainId}: "${escrowAddress}",`);
    console.log(`   }`);
    console.log("\n2. Add oracle address for production:");
    console.log(`   await escrowV3.addOracle("YOUR_ORACLE_ADDRESS")`);
    console.log("\n3. Test the contract:");
    console.log(`   npx hardhat test test/BillHavenEscrowV3.test.js --network ${network.name || 'hardhat'}`);
    console.log("\n4. Verify on block explorer:");
    console.log(`   npx hardhat verify --network ${network.name || 'polygon'} ${escrowAddress} "${FEE_WALLET}"`);

    return { escrowAddress, chainId };
}

main()
    .then(({ escrowAddress, chainId }) => {
        console.log("\n✅ Deployment successful!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    });
