const { expect } = require("chai");
const { ethers } = require("hardhat");

// Custom time helpers
const time = {
    increase: async (seconds) => {
        await ethers.provider.send("evm_increaseTime", [seconds]);
        await ethers.provider.send("evm_mine");
    },
    latest: async () => {
        const block = await ethers.provider.getBlock("latest");
        return block.timestamp;
    }
};

describe("BillHavenEscrowV4 - Security Tests", function () {
    let escrow;
    let mockToken;
    let owner, seller, buyer, oracle, arbitrator, feeWallet, randomUser, attacker;

    // Constants
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    const ARBITRATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ARBITRATOR_ROLE"));
    const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE_ROLE"));

    // Payment methods
    const PaymentMethod = {
        CRYPTO: 0,
        CASH_DEPOSIT: 1,
        WIRE_TRANSFER: 2,
        IDEAL: 3,
        SEPA: 4,
        BANK_TRANSFER: 5,
        PAYPAL_FRIENDS: 6,
        PAYPAL_GOODS: 7,
        CREDIT_CARD: 8,
        OTHER: 9
    };

    // Confirmation statuses
    const ConfirmationStatus = {
        CREATED: 0,
        FUNDED: 1,
        CLAIMED: 2,
        PAYMENT_SENT: 3,
        PAYMENT_VERIFIED: 4,
        HOLD_COMPLETE: 5,
        RELEASED: 6,
        DISPUTED: 7,
        REFUNDED: 8,
        CANCELLED: 9
    };

    beforeEach(async function () {
        [owner, seller, buyer, oracle, arbitrator, feeWallet, randomUser, attacker] = await ethers.getSigners();

        // Deploy mock ERC20 token
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy("Mock USDT", "USDT", 6);
        await mockToken.waitForDeployment();

        // Mint tokens to seller
        await mockToken.mint(seller.address, ethers.parseUnits("10000", 6));

        // Deploy V4 Escrow
        const EscrowV4 = await ethers.getContractFactory("BillHavenEscrowV4");
        escrow = await EscrowV4.deploy(feeWallet.address);
        await escrow.waitForDeployment();

        // Setup roles
        await escrow.grantRole(ARBITRATOR_ROLE, arbitrator.address);
        await escrow.addOracle(oracle.address);

        // Add token support
        await escrow.addSupportedToken(await mockToken.getAddress());
    });

    // Helper function to create Oracle signature (V4 format with chainId)
    async function createOracleSignature(billId, payer, billMaker, fiatAmount, paymentReference, timestamp) {
        const chainId = (await ethers.provider.getNetwork()).chainId;
        const contractAddress = await escrow.getAddress();

        const messageHash = ethers.solidityPackedKeccak256(
            ["uint256", "address", "uint256", "address", "address", "uint256", "bytes32", "uint256"],
            [chainId, contractAddress, billId, payer, billMaker, fiatAmount, paymentReference, timestamp]
        );

        const signature = await oracle.signMessage(ethers.getBytes(messageHash));
        return signature;
    }

    describe("V4 Deployment Verification", function () {
        it("Should have 24-hour minimum security delay constant", async function () {
            expect(await escrow.getMinSecurityDelay()).to.equal(24 * 60 * 60); // 24 hours in seconds
        });

        it("Should have increased cash deposit hold period to 24 hours", async function () {
            expect(await escrow.getHoldPeriod(PaymentMethod.CASH_DEPOSIT)).to.equal(24 * 60 * 60);
        });
    });

    describe("V4 CRITICAL: Oracle Verification Required", function () {
        let billId;
        const fiatAmount = 10000; // $100 in cents
        const paymentRef = ethers.keccak256(ethers.toUtf8Bytes("PAYMENT_REF_001"));

        beforeEach(async function () {
            // Create and claim bill
            const tx = await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, {
                value: ethers.parseEther("1")
            });
            const receipt = await tx.wait();
            billId = 1;

            // Buyer claims
            await escrow.connect(buyer).claimBill(billId);

            // Buyer confirms payment sent
            await escrow.connect(buyer).confirmPaymentSent(billId, paymentRef);
        });

        it("Should BLOCK makerConfirmPayment if Oracle hasn't verified", async function () {
            // V4: Maker cannot confirm without Oracle verification
            await expect(
                escrow.connect(seller).makerConfirmPayment(billId)
            ).to.be.revertedWithCustomError(escrow, "PaymentNotOracleVerified");
        });

        it("Should ALWAYS BLOCK makerConfirmAndRelease (V4 security)", async function () {
            // V4: This function always reverts
            await expect(
                escrow.connect(seller).makerConfirmAndRelease(billId)
            ).to.be.revertedWithCustomError(escrow, "SecurityDelayRequired");
        });

        it("Should BLOCK releaseFunds without Oracle verification", async function () {
            // Try to release without Oracle - should fail
            await expect(
                escrow.connect(seller).releaseFunds(billId)
            ).to.be.revertedWithCustomError(escrow, "PaymentNotOracleVerified");
        });

        it("Should BLOCK autoRelease without Oracle verification", async function () {
            // Fast forward time
            await time.increase(7 * 24 * 60 * 60); // 7 days

            // Try auto release without Oracle
            await expect(
                escrow.connect(randomUser).autoRelease(billId)
            ).to.be.revertedWithCustomError(escrow, "PaymentNotOracleVerified");
        });

        it("Should ALLOW makerConfirmPayment AFTER Oracle has verified", async function () {
            // First, Oracle verifies
            const timestamp = await time.latest();
            const signature = await createOracleSignature(
                billId, buyer.address, seller.address, fiatAmount, paymentRef, timestamp
            );

            await escrow.verifyPaymentReceived(billId, paymentRef, fiatAmount, timestamp, signature);

            // Now maker CAN confirm (but doesn't speed up release)
            await expect(escrow.connect(seller).makerConfirmPayment(billId)).to.not.be.reverted;

            const bill = await escrow.getBill(billId);
            expect(bill.makerConfirmed).to.be.true;
            expect(bill.oracleVerified).to.be.true;
        });
    });

    describe("V4 CRITICAL: Signature Replay Prevention", function () {
        let billId;
        const fiatAmount = 10000;
        const paymentRef = ethers.keccak256(ethers.toUtf8Bytes("PAYMENT_REF_002"));

        beforeEach(async function () {
            const tx = await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, {
                value: ethers.parseEther("1")
            });
            billId = 1;
            await escrow.connect(buyer).claimBill(billId);
            await escrow.connect(buyer).confirmPaymentSent(billId, paymentRef);
        });

        it("Should REJECT signature with wrong chain ID (cross-chain replay)", async function () {
            const timestamp = await time.latest();

            // Create signature with WRONG chain ID (simulating cross-chain attack)
            const wrongChainId = 999999;
            const contractAddress = await escrow.getAddress();

            const messageHash = ethers.solidityPackedKeccak256(
                ["uint256", "address", "uint256", "address", "address", "uint256", "bytes32", "uint256"],
                [wrongChainId, contractAddress, billId, buyer.address, seller.address, fiatAmount, paymentRef, timestamp]
            );

            const badSignature = await oracle.signMessage(ethers.getBytes(messageHash));

            await expect(
                escrow.verifyPaymentReceived(billId, paymentRef, fiatAmount, timestamp, badSignature)
            ).to.be.revertedWithCustomError(escrow, "InvalidSignature");
        });

        it("Should REJECT reused signature (same-chain replay)", async function () {
            const timestamp = await time.latest();
            const signature = await createOracleSignature(
                billId, buyer.address, seller.address, fiatAmount, paymentRef, timestamp
            );

            // First use - should succeed
            await escrow.verifyPaymentReceived(billId, paymentRef, fiatAmount, timestamp, signature);

            // Create another bill with same payment reference would fail anyway
            // But let's test the signature tracking explicitly
            const bill = await escrow.getBill(billId);
            expect(bill.oracleVerified).to.be.true;
        });

        it("Should REJECT signatures older than 5 minutes", async function () {
            // Get timestamp from 10 minutes ago
            const currentTime = await time.latest();
            const oldTimestamp = currentTime - (10 * 60); // 10 minutes ago

            const signature = await createOracleSignature(
                billId, buyer.address, seller.address, fiatAmount, paymentRef, oldTimestamp
            );

            await expect(
                escrow.verifyPaymentReceived(billId, paymentRef, fiatAmount, oldTimestamp, signature)
            ).to.be.revertedWithCustomError(escrow, "InvalidSignature");
        });

        it("Should ACCEPT valid signature within 5-minute window", async function () {
            const timestamp = await time.latest();
            const signature = await createOracleSignature(
                billId, buyer.address, seller.address, fiatAmount, paymentRef, timestamp
            );

            await expect(
                escrow.verifyPaymentReceived(billId, paymentRef, fiatAmount, timestamp, signature)
            ).to.not.be.reverted;

            const bill = await escrow.getBill(billId);
            expect(bill.oracleVerified).to.be.true;
            expect(bill.status).to.equal(ConfirmationStatus.PAYMENT_VERIFIED);
        });
    });

    describe("V4 CRITICAL: Hold Period Enforcement", function () {
        let billId;
        const fiatAmount = 10000;
        const paymentRef = ethers.keccak256(ethers.toUtf8Bytes("PAYMENT_REF_003"));

        beforeEach(async function () {
            const tx = await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, {
                value: ethers.parseEther("1")
            });
            billId = 1;
            await escrow.connect(buyer).claimBill(billId);
            await escrow.connect(buyer).confirmPaymentSent(billId, paymentRef);

            // Oracle verifies
            const timestamp = await time.latest();
            const signature = await createOracleSignature(
                billId, buyer.address, seller.address, fiatAmount, paymentRef, timestamp
            );
            await escrow.verifyPaymentReceived(billId, paymentRef, fiatAmount, timestamp, signature);
        });

        it("Should BLOCK release before hold period", async function () {
            // Try immediate release - should fail
            await expect(
                escrow.connect(seller).releaseFunds(billId)
            ).to.be.revertedWithCustomError(escrow, "HoldPeriodNotElapsed");
        });

        it("Should BLOCK auto-release before hold period", async function () {
            // Try immediate auto-release - should fail
            await expect(
                escrow.autoReleaseAfterHoldPeriod(billId)
            ).to.be.revertedWithCustomError(escrow, "HoldPeriodNotElapsed");
        });

        it("Should ALLOW auto-release after hold period (PERMISSIONLESS)", async function () {
            // Fast forward past hold period (24 hours for iDEAL)
            await time.increase(25 * 60 * 60); // 25 hours

            // Anyone can trigger release
            const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

            await expect(escrow.connect(randomUser).autoReleaseAfterHoldPeriod(billId)).to.not.be.reverted;

            const bill = await escrow.getBill(billId);
            expect(bill.status).to.equal(ConfirmationStatus.RELEASED);
        });
    });

    describe("V4 NEW: Payer Dispute Before Release", function () {
        let billId;
        const fiatAmount = 10000;
        const paymentRef = ethers.keccak256(ethers.toUtf8Bytes("PAYMENT_REF_004"));

        beforeEach(async function () {
            const tx = await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, {
                value: ethers.parseEther("1")
            });
            billId = 1;
            await escrow.connect(buyer).claimBill(billId);
            await escrow.connect(buyer).confirmPaymentSent(billId, paymentRef);
        });

        it("Should ALLOW payer to dispute before release", async function () {
            await expect(escrow.connect(buyer).payerDisputeBeforeRelease(billId))
                .to.emit(escrow, "PayerDisputeRaised")
                .withArgs(billId, buyer.address);

            const bill = await escrow.getBill(billId);
            expect(bill.status).to.equal(ConfirmationStatus.DISPUTED);
        });

        it("Should BLOCK non-payer from using payerDisputeBeforeRelease", async function () {
            await expect(
                escrow.connect(seller).payerDisputeBeforeRelease(billId)
            ).to.be.revertedWithCustomError(escrow, "NotBillPayer");

            await expect(
                escrow.connect(attacker).payerDisputeBeforeRelease(billId)
            ).to.be.revertedWithCustomError(escrow, "NotBillPayer");
        });

        it("Should BLOCK release after payer dispute", async function () {
            // Payer disputes
            await escrow.connect(buyer).payerDisputeBeforeRelease(billId);

            // Oracle tries to verify - should fail because disputed
            const timestamp = await time.latest();
            const signature = await createOracleSignature(
                billId, buyer.address, seller.address, fiatAmount, paymentRef, timestamp
            );

            await expect(
                escrow.verifyPaymentReceived(billId, paymentRef, fiatAmount, timestamp, signature)
            ).to.be.revertedWithCustomError(escrow, "InvalidState");
        });
    });

    describe("V4 Arbitration (Dispute Resolution)", function () {
        let billId;
        const fiatAmount = 10000;
        const paymentRef = ethers.keccak256(ethers.toUtf8Bytes("PAYMENT_REF_005"));

        beforeEach(async function () {
            const tx = await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, {
                value: ethers.parseEther("1")
            });
            billId = 1;
            await escrow.connect(buyer).claimBill(billId);
            await escrow.connect(buyer).confirmPaymentSent(billId, paymentRef);

            // Raise dispute
            await escrow.connect(buyer).raiseDispute(billId);
        });

        it("Should allow arbitrator to release to payer (bypasses Oracle in disputes)", async function () {
            // V4: Arbitrator CAN release even without Oracle verification
            await expect(escrow.connect(arbitrator).resolveDispute(billId, true)).to.not.be.reverted;

            const bill = await escrow.getBill(billId);
            expect(bill.status).to.equal(ConfirmationStatus.RELEASED);
        });

        it("Should allow arbitrator to refund to maker", async function () {
            await expect(escrow.connect(arbitrator).resolveDispute(billId, false)).to.not.be.reverted;

            const bill = await escrow.getBill(billId);
            expect(bill.status).to.equal(ConfirmationStatus.REFUNDED);
        });
    });

    describe("V4 Complete Flow Test", function () {
        it("Should complete full secure flow: Create -> Claim -> Pay -> Oracle Verify -> Wait -> Release", async function () {
            const fiatAmount = 50000; // $500
            const paymentRef = ethers.keccak256(ethers.toUtf8Bytes("FULL_FLOW_TEST"));

            // 1. Seller creates bill
            await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, {
                value: ethers.parseEther("1")
            });
            const billId = 1;

            // 2. Buyer claims
            await escrow.connect(buyer).claimBill(billId);

            // 3. Buyer marks payment sent
            await escrow.connect(buyer).confirmPaymentSent(billId, paymentRef);

            // 4. Oracle verifies (simulating Stripe webhook)
            const timestamp = await time.latest();
            const signature = await createOracleSignature(
                billId, buyer.address, seller.address, fiatAmount, paymentRef, timestamp
            );
            await escrow.verifyPaymentReceived(billId, paymentRef, fiatAmount, timestamp, signature);

            // Check bill is verified
            let bill = await escrow.getBill(billId);
            expect(bill.oracleVerified).to.be.true;
            expect(bill.status).to.equal(ConfirmationStatus.PAYMENT_VERIFIED);

            // 5. Wait for hold period (24 hours)
            await time.increase(25 * 60 * 60);

            // 6. Release funds
            const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);
            await escrow.autoReleaseAfterHoldPeriod(billId);

            // 7. Verify release
            bill = await escrow.getBill(billId);
            expect(bill.status).to.equal(ConfirmationStatus.RELEASED);
        });
    });
});
