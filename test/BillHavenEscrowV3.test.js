const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BillHavenEscrowV3", function () {
    let escrow;
    let mockToken;
    let owner, seller, buyer, oracle, arbitrator, feeWallet, randomUser;

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
        [owner, seller, buyer, oracle, arbitrator, feeWallet, randomUser] = await ethers.getSigners();

        // Deploy mock ERC20 token
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy("Mock USDT", "USDT", 6);
        await mockToken.waitForDeployment();

        // Mint tokens to seller
        await mockToken.mint(seller.address, ethers.parseUnits("10000", 6));

        // Deploy V3 Escrow
        const EscrowV3 = await ethers.getContractFactory("BillHavenEscrowV3");
        escrow = await EscrowV3.deploy(feeWallet.address);
        await escrow.waitForDeployment();

        // Setup roles
        await escrow.grantRole(ARBITRATOR_ROLE, arbitrator.address);
        await escrow.addOracle(oracle.address);

        // Add token support
        await escrow.addSupportedToken(await mockToken.getAddress());
    });

    describe("Deployment", function () {
        it("Should set the correct fee wallet", async function () {
            expect(await escrow.feeWallet()).to.equal(feeWallet.address);
        });

        it("Should set the correct platform fee (4.4%)", async function () {
            expect(await escrow.platformFeePercent()).to.equal(440);
        });

        it("Should have correct hold periods", async function () {
            expect(await escrow.getHoldPeriod(PaymentMethod.CRYPTO)).to.equal(0);
            expect(await escrow.getHoldPeriod(PaymentMethod.CASH_DEPOSIT)).to.equal(3600); // 1 hour
            expect(await escrow.getHoldPeriod(PaymentMethod.IDEAL)).to.equal(86400); // 24 hours
            expect(await escrow.getHoldPeriod(PaymentMethod.BANK_TRANSFER)).to.equal(432000); // 5 days
        });

        it("Should block high-risk payment methods", async function () {
            expect(await escrow.isMethodBlocked(PaymentMethod.PAYPAL_GOODS)).to.be.true;
            expect(await escrow.isMethodBlocked(PaymentMethod.CREDIT_CARD)).to.be.true;
            expect(await escrow.isMethodBlocked(PaymentMethod.IDEAL)).to.be.false;
        });
    });

    describe("Bill Creation - Native Token", function () {
        it("Should create a bill with native token", async function () {
            const amount = ethers.parseEther("1.0");
            const fiatAmount = 50000; // $500.00

            await expect(
                escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, { value: amount })
            ).to.emit(escrow, "BillCreated");

            const bill = await escrow.getBill(1);
            expect(bill.billMaker).to.equal(seller.address);
            expect(bill.status).to.equal(ConfirmationStatus.FUNDED);
            expect(bill.paymentMethod).to.equal(PaymentMethod.IDEAL);
        });

        it("Should calculate platform fee correctly (4.4%)", async function () {
            const amount = ethers.parseEther("1.0");
            const fiatAmount = 50000;

            await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, { value: amount });

            const bill = await escrow.getBill(1);
            const expectedFee = (amount * 440n) / 10000n;
            const expectedPayout = amount - expectedFee;

            expect(bill.platformFee).to.equal(expectedFee);
            expect(bill.amount).to.equal(expectedPayout);
        });

        it("Should reject blocked payment methods", async function () {
            const amount = ethers.parseEther("1.0");
            const fiatAmount = 50000;

            await expect(
                escrow.connect(seller).createBill(fiatAmount, PaymentMethod.CREDIT_CARD, { value: amount })
            ).to.be.revertedWithCustomError(escrow, "PaymentMethodBlocked");

            await expect(
                escrow.connect(seller).createBill(fiatAmount, PaymentMethod.PAYPAL_GOODS, { value: amount })
            ).to.be.revertedWithCustomError(escrow, "PaymentMethodBlocked");
        });
    });

    describe("Bill Creation - ERC20 Token", function () {
        it("Should create a bill with ERC20 token", async function () {
            const amount = ethers.parseUnits("100", 6); // 100 USDT
            const fiatAmount = 10000; // $100.00

            // Approve tokens
            await mockToken.connect(seller).approve(await escrow.getAddress(), amount);

            await expect(
                escrow.connect(seller).createBillWithToken(
                    await mockToken.getAddress(),
                    amount,
                    fiatAmount,
                    PaymentMethod.IDEAL
                )
            ).to.emit(escrow, "BillCreated");

            const bill = await escrow.getBill(1);
            expect(bill.token).to.equal(await mockToken.getAddress());
        });

        it("Should reject unsupported tokens", async function () {
            const fakeToken = randomUser.address;
            const amount = ethers.parseUnits("100", 6);
            const fiatAmount = 10000;

            await expect(
                escrow.connect(seller).createBillWithToken(fakeToken, amount, fiatAmount, PaymentMethod.IDEAL)
            ).to.be.revertedWithCustomError(escrow, "TokenNotSupported");
        });
    });

    describe("Bill Claim", function () {
        beforeEach(async function () {
            const amount = ethers.parseEther("1.0");
            const fiatAmount = 50000;
            await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, { value: amount });
        });

        it("Should allow buyer to claim bill", async function () {
            await expect(escrow.connect(buyer).claimBill(1))
                .to.emit(escrow, "BillClaimed")
                .withArgs(1, buyer.address);

            const bill = await escrow.getBill(1);
            expect(bill.payer).to.equal(buyer.address);
            expect(bill.status).to.equal(ConfirmationStatus.CLAIMED);
        });

        it("Should reject claim from bill maker", async function () {
            await expect(
                escrow.connect(seller).claimBill(1)
            ).to.be.revertedWithCustomError(escrow, "NotAuthorized");
        });

        it("Should reject double claims", async function () {
            await escrow.connect(buyer).claimBill(1);

            await expect(
                escrow.connect(randomUser).claimBill(1)
            ).to.be.revertedWithCustomError(escrow, "BillAlreadyClaimed");
        });
    });

    describe("Payment Confirmation - Multi-Step Flow", function () {
        beforeEach(async function () {
            const amount = ethers.parseEther("1.0");
            const fiatAmount = 50000;
            await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, { value: amount });
            await escrow.connect(buyer).claimBill(1);
        });

        it("Should allow payer to mark payment sent", async function () {
            const paymentRef = ethers.keccak256(ethers.toUtf8Bytes("payment-123"));

            await expect(escrow.connect(buyer).confirmPaymentSent(1, paymentRef))
                .to.emit(escrow, "PaymentMarkedSent")
                .withArgs(1, paymentRef);

            const bill = await escrow.getBill(1);
            expect(bill.status).to.equal(ConfirmationStatus.PAYMENT_SENT);
            expect(bill.payerConfirmed).to.be.true;
        });

        it("Should reject payment reference reuse", async function () {
            const paymentRef = ethers.keccak256(ethers.toUtf8Bytes("payment-123"));

            await escrow.connect(buyer).confirmPaymentSent(1, paymentRef);

            // Create another bill
            await escrow.connect(seller).createBill(50000, PaymentMethod.IDEAL, { value: ethers.parseEther("1.0") });
            await escrow.connect(buyer).claimBill(2);

            // Try to reuse the same reference
            await expect(
                escrow.connect(buyer).confirmPaymentSent(2, paymentRef)
            ).to.be.revertedWithCustomError(escrow, "PaymentReferenceUsed");
        });
    });

    describe("Oracle Verification", function () {
        let paymentRef;

        beforeEach(async function () {
            const amount = ethers.parseEther("1.0");
            const fiatAmount = 50000;
            await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, { value: amount });
            await escrow.connect(buyer).claimBill(1);

            paymentRef = ethers.keccak256(ethers.toUtf8Bytes("payment-123"));
            await escrow.connect(buyer).confirmPaymentSent(1, paymentRef);
        });

        it("Should verify payment with valid oracle signature", async function () {
            const bill = await escrow.getBill(1);
            const timestamp = Math.floor(Date.now() / 1000);

            // Create message hash
            const messageHash = ethers.solidityPackedKeccak256(
                ['uint256', 'address', 'address', 'uint256', 'bytes32', 'uint256'],
                [1, buyer.address, seller.address, bill.fiatAmount, paymentRef, timestamp]
            );

            // Sign message
            const signature = await oracle.signMessage(ethers.getBytes(messageHash));

            await expect(
                escrow.verifyPaymentReceived(1, paymentRef, bill.fiatAmount, timestamp, signature)
            ).to.emit(escrow, "PaymentVerified");

            const updatedBill = await escrow.getBill(1);
            expect(updatedBill.status).to.equal(ConfirmationStatus.PAYMENT_VERIFIED);
            expect(updatedBill.oracleVerified).to.be.true;
        });

        it("Should reject invalid oracle signature", async function () {
            const bill = await escrow.getBill(1);
            const timestamp = Math.floor(Date.now() / 1000);

            // Create message hash
            const messageHash = ethers.solidityPackedKeccak256(
                ['uint256', 'address', 'address', 'uint256', 'bytes32', 'uint256'],
                [1, buyer.address, seller.address, bill.fiatAmount, paymentRef, timestamp]
            );

            // Sign with non-oracle wallet
            const signature = await randomUser.signMessage(ethers.getBytes(messageHash));

            await expect(
                escrow.verifyPaymentReceived(1, paymentRef, bill.fiatAmount, timestamp, signature)
            ).to.be.revertedWithCustomError(escrow, "InvalidSignature");
        });
    });

    describe("Maker Confirmation", function () {
        beforeEach(async function () {
            const amount = ethers.parseEther("1.0");
            const fiatAmount = 50000;
            await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, { value: amount });
            await escrow.connect(buyer).claimBill(1);

            const paymentRef = ethers.keccak256(ethers.toUtf8Bytes("payment-123"));
            await escrow.connect(buyer).confirmPaymentSent(1, paymentRef);
        });

        it("Should allow maker to confirm payment", async function () {
            await expect(escrow.connect(seller).makerConfirmPayment(1))
                .to.emit(escrow, "PaymentVerified");

            const bill = await escrow.getBill(1);
            expect(bill.makerConfirmed).to.be.true;
            expect(bill.status).to.equal(ConfirmationStatus.PAYMENT_VERIFIED);
        });

        it("Should allow maker to confirm and release immediately", async function () {
            const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

            await expect(escrow.connect(seller).makerConfirmAndRelease(1))
                .to.emit(escrow, "CryptoReleased");

            const bill = await escrow.getBill(1);
            expect(bill.status).to.equal(ConfirmationStatus.RELEASED);

            const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
            expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);
        });
    });

    describe("Hold Period Enforcement", function () {
        beforeEach(async function () {
            const amount = ethers.parseEther("1.0");
            const fiatAmount = 50000;
            // Use BANK_TRANSFER for 5 day hold period
            await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.BANK_TRANSFER, { value: amount });
            await escrow.connect(buyer).claimBill(1);

            const paymentRef = ethers.keccak256(ethers.toUtf8Bytes("payment-123"));
            await escrow.connect(buyer).confirmPaymentSent(1, paymentRef);
            await escrow.connect(seller).makerConfirmPayment(1);
        });

        it("Should reject release before hold period", async function () {
            await expect(
                escrow.connect(buyer).releaseFunds(1)
            ).to.be.revertedWithCustomError(escrow, "HoldPeriodNotElapsed");
        });

        it("Should allow release after hold period (5 days)", async function () {
            // Fast forward 5 days + 1 second
            await time.increase(5 * 24 * 60 * 60 + 1);

            await expect(escrow.connect(buyer).releaseFunds(1))
                .to.emit(escrow, "CryptoReleased");
        });

        it("Should allow auto-release after hold period", async function () {
            // Fast forward 5 days + 1 second
            await time.increase(5 * 24 * 60 * 60 + 1);

            // Anyone can call autoRelease
            await expect(escrow.connect(randomUser).autoRelease(1))
                .to.emit(escrow, "CryptoReleased");
        });

        it("Should correctly report canRelease status", async function () {
            let [canRel, reason] = await escrow.canRelease(1);
            expect(canRel).to.be.false;
            expect(reason).to.equal("Hold period not elapsed");

            // Fast forward
            await time.increase(5 * 24 * 60 * 60 + 1);

            [canRel, reason] = await escrow.canRelease(1);
            expect(canRel).to.be.true;
            expect(reason).to.equal("Ready to release");
        });
    });

    describe("Crypto Payment Method (Instant)", function () {
        it("Should allow instant release for crypto payments", async function () {
            const amount = ethers.parseEther("1.0");
            const fiatAmount = 50000;

            // Use CRYPTO payment method (0 hold period)
            await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.CRYPTO, { value: amount });
            await escrow.connect(buyer).claimBill(1);

            const paymentRef = ethers.keccak256(ethers.toUtf8Bytes("payment-123"));
            await escrow.connect(buyer).confirmPaymentSent(1, paymentRef);
            await escrow.connect(seller).makerConfirmPayment(1);

            // Should be able to release immediately
            await expect(escrow.connect(buyer).releaseFunds(1))
                .to.emit(escrow, "CryptoReleased");
        });
    });

    describe("Velocity Limits", function () {
        it("Should enforce max trade size for new users ($500)", async function () {
            const amount = ethers.parseEther("10.0");
            const fiatAmount = 60000; // $600 - exceeds $500 limit for new users

            await expect(
                escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, { value: amount })
            ).to.be.revertedWithCustomError(escrow, "VelocityLimitExceededError");
        });

        it("Should allow trades within limits", async function () {
            const amount = ethers.parseEther("1.0");
            const fiatAmount = 40000; // $400 - within $500 limit

            await expect(
                escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, { value: amount })
            ).to.emit(escrow, "BillCreated");
        });

        it("Should upgrade user trust level after successful trades", async function () {
            // Create and complete 6 successful trades
            for (let i = 0; i < 6; i++) {
                const amount = ethers.parseEther("0.1");
                const fiatAmount = 5000; // $50

                await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.CRYPTO, { value: amount });
                await escrow.connect(buyer).claimBill(i + 1);

                const paymentRef = ethers.keccak256(ethers.toUtf8Bytes(`payment-${i}`));
                await escrow.connect(buyer).confirmPaymentSent(i + 1, paymentRef);
                await escrow.connect(seller).makerConfirmAndRelease(i + 1);
            }

            // Check trust level upgraded
            const sellerStats = await escrow.getUserStats(seller.address);
            const buyerStats = await escrow.getUserStats(buyer.address);

            expect(sellerStats.successfulTrades).to.equal(6);
            expect(buyerStats.successfulTrades).to.equal(6);
            expect(sellerStats.trustLevel).to.equal(1); // TRUSTED
            expect(buyerStats.trustLevel).to.equal(1); // TRUSTED
        });
    });

    describe("Disputes", function () {
        beforeEach(async function () {
            const amount = ethers.parseEther("1.0");
            const fiatAmount = 50000;
            await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, { value: amount });
            await escrow.connect(buyer).claimBill(1);
        });

        it("Should allow bill maker to raise dispute", async function () {
            await expect(escrow.connect(seller).raiseDispute(1))
                .to.emit(escrow, "BillDisputed")
                .withArgs(1, seller.address);

            const bill = await escrow.getBill(1);
            expect(bill.status).to.equal(ConfirmationStatus.DISPUTED);
        });

        it("Should allow payer to raise dispute", async function () {
            await expect(escrow.connect(buyer).raiseDispute(1))
                .to.emit(escrow, "BillDisputed")
                .withArgs(1, buyer.address);
        });

        it("Should allow arbitrator to resolve dispute in favor of payer", async function () {
            await escrow.connect(seller).raiseDispute(1);

            await expect(escrow.connect(arbitrator).resolveDispute(1, true))
                .to.emit(escrow, "CryptoReleased");

            const bill = await escrow.getBill(1);
            expect(bill.status).to.equal(ConfirmationStatus.RELEASED);
        });

        it("Should allow arbitrator to resolve dispute in favor of maker", async function () {
            await escrow.connect(seller).raiseDispute(1);

            await expect(escrow.connect(arbitrator).resolveDispute(1, false))
                .to.emit(escrow, "BillRefunded");

            const bill = await escrow.getBill(1);
            expect(bill.status).to.equal(ConfirmationStatus.REFUNDED);
        });

        it("Should reject non-arbitrator resolving disputes", async function () {
            await escrow.connect(seller).raiseDispute(1);

            await expect(
                escrow.connect(randomUser).resolveDispute(1, true)
            ).to.be.reverted;
        });
    });

    describe("Bill Cancellation & Refunds", function () {
        it("Should allow maker to cancel unclaimed bill", async function () {
            const amount = ethers.parseEther("1.0");
            const fiatAmount = 50000;
            await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, { value: amount });

            const balanceBefore = await ethers.provider.getBalance(seller.address);

            const tx = await escrow.connect(seller).cancelBill(1);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            const balanceAfter = await ethers.provider.getBalance(seller.address);
            expect(balanceAfter + gasUsed).to.be.closeTo(balanceBefore + amount, ethers.parseEther("0.001"));
        });

        it("Should reject cancellation of claimed bill", async function () {
            const amount = ethers.parseEther("1.0");
            const fiatAmount = 50000;
            await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, { value: amount });
            await escrow.connect(buyer).claimBill(1);

            await expect(
                escrow.connect(seller).cancelBill(1)
            ).to.be.revertedWithCustomError(escrow, "InvalidState");
        });

        it("Should allow refund of expired unclaimed bill", async function () {
            const amount = ethers.parseEther("1.0");
            const fiatAmount = 50000;
            await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, { value: amount });

            // Fast forward 7 days + 1 second
            await time.increase(7 * 24 * 60 * 60 + 1);

            await expect(escrow.refundExpiredBill(1))
                .to.emit(escrow, "BillRefunded");
        });
    });

    describe("Fee Distribution", function () {
        it("Should distribute fees correctly on release", async function () {
            const amount = ethers.parseEther("1.0");
            const fiatAmount = 50000;

            await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.CRYPTO, { value: amount });
            await escrow.connect(buyer).claimBill(1);

            const paymentRef = ethers.keccak256(ethers.toUtf8Bytes("payment-123"));
            await escrow.connect(buyer).confirmPaymentSent(1, paymentRef);

            const feeWalletBalanceBefore = await ethers.provider.getBalance(feeWallet.address);
            const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

            await escrow.connect(seller).makerConfirmAndRelease(1);

            const bill = await escrow.getBill(1);
            const expectedFee = (amount * 440n) / 10000n;
            const expectedPayout = amount - expectedFee;

            const feeWalletBalanceAfter = await ethers.provider.getBalance(feeWallet.address);
            const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);

            expect(feeWalletBalanceAfter - feeWalletBalanceBefore).to.equal(expectedFee);
            expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(expectedPayout);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow admin to update hold periods", async function () {
            await escrow.updateHoldPeriod(PaymentMethod.IDEAL, 48 * 3600); // 48 hours

            expect(await escrow.getHoldPeriod(PaymentMethod.IDEAL)).to.equal(48 * 3600);
        });

        it("Should allow admin to block/unblock payment methods", async function () {
            // Unblock credit card (for testing)
            await escrow.setMethodBlocked(PaymentMethod.CREDIT_CARD, false);
            expect(await escrow.isMethodBlocked(PaymentMethod.CREDIT_CARD)).to.be.false;

            // Re-block it
            await escrow.setMethodBlocked(PaymentMethod.CREDIT_CARD, true);
            expect(await escrow.isMethodBlocked(PaymentMethod.CREDIT_CARD)).to.be.true;
        });

        it("Should allow admin to update velocity limits", async function () {
            await escrow.updateVelocityLimits(
                0, // NEW_USER
                200000,  // $2,000 daily
                1000000, // $10,000 weekly
                100000,  // $1,000 per trade
                5        // 5 trades per day
            );

            const limits = await escrow.getUserLimits(randomUser.address);
            expect(limits.maxDailyVolume).to.equal(200000);
            expect(limits.maxTradeSize).to.equal(100000);
        });

        it("Should allow admin to blacklist users", async function () {
            await escrow.setUserBlacklist(randomUser.address, true);

            const stats = await escrow.getUserStats(randomUser.address);
            expect(stats.isBlacklisted).to.be.true;

            // Blacklisted user cannot create bills
            await expect(
                escrow.connect(randomUser).createBill(10000, PaymentMethod.IDEAL, { value: ethers.parseEther("0.1") })
            ).to.be.revertedWithCustomError(escrow, "UserBlacklisted");
        });

        it("Should allow admin to pause/unpause", async function () {
            await escrow.pause();

            await expect(
                escrow.connect(seller).createBill(10000, PaymentMethod.IDEAL, { value: ethers.parseEther("0.1") })
            ).to.be.reverted;

            await escrow.unpause();

            await expect(
                escrow.connect(seller).createBill(10000, PaymentMethod.IDEAL, { value: ethers.parseEther("0.1") })
            ).to.emit(escrow, "BillCreated");
        });
    });
});

// Mock ERC20 Token for testing
const MockERC20 = {
    abi: [
        "function mint(address to, uint256 amount) external",
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)"
    ]
};
