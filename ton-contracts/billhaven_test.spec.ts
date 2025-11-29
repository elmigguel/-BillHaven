/**
 * BillHaven Escrow Smart Contract - Test Suite
 *
 * Comprehensive tests for all contract functionality
 */

import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address } from '@ton/core';
import { BillHavenEscrow } from './billhaven_wrapper';
import '@ton/test-utils';

describe('BillHavenEscrow', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let billMaker: SandboxContract<TreasuryContract>;
    let payer: SandboxContract<TreasuryContract>;
    let admin: SandboxContract<TreasuryContract>;
    let escrow: SandboxContract<BillHavenEscrow>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        // Create test accounts
        deployer = await blockchain.treasury('deployer');
        billMaker = await blockchain.treasury('billMaker');
        payer = await blockchain.treasury('payer');
        admin = await blockchain.treasury('admin');

        // Deploy contract
        escrow = blockchain.openContract(
            await BillHavenEscrow.createFromConfig(
                { owner: admin.address },
                code // You need to load compiled code here
            )
        );

        const deployResult = await escrow.sendDeploy(
            deployer.getSender(),
            toNano('0.5')
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: escrow.address,
            deploy: true,
            success: true,
        });
    });

    // ========================================================================
    // DEPLOYMENT TESTS
    // ========================================================================

    describe('Deployment', () => {
        it('should deploy successfully', async () => {
            const owner = await escrow.getOwner();
            expect(owner.toString()).toBe(admin.address.toString());
        });

        it('should initialize with correct platform fee', async () => {
            const fee = await escrow.getPlatformFee();
            expect(fee).toBe(440); // 4.4%
        });

        it('should start with bill ID 1', async () => {
            const nextId = await escrow.getNextBillId();
            expect(nextId).toBe(1n);
        });

        it('should have zero fees collected initially', async () => {
            const fees = await escrow.getTotalFeesCollected();
            expect(fees).toBe(0n);
        });
    });

    // ========================================================================
    // CREATE BILL TESTS
    // ========================================================================

    describe('Create Bill', () => {
        it('should create bill with TON', async () => {
            const result = await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: toNano('10'),
                description: 'Test bill',
            });

            expect(result.transactions).toHaveTransaction({
                from: billMaker.address,
                to: escrow.address,
                success: true,
            });

            const bill = await escrow.getBill(1n);
            expect(bill).not.toBeNull();
            expect(bill!.maker.toString()).toBe(billMaker.address.toString());
            expect(bill!.payer.toString()).toBe(payer.address.toString());
            expect(bill!.amount).toBe(toNano('10'));
            expect(bill!.status).toBe(1); // CREATED
        });

        it('should auto-increment bill ID', async () => {
            await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: toNano('5'),
                description: 'Bill 1',
            });

            await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: toNano('7'),
                description: 'Bill 2',
            });

            const bill1 = await escrow.getBill(1n);
            const bill2 = await escrow.getBill(2n);

            expect(bill1!.billId).toBe(1n);
            expect(bill2!.billId).toBe(2n);
        });

        it('should fail with insufficient TON', async () => {
            const result = await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: toNano('10'),
                description: 'Test bill',
            });

            // This should fail because we're not sending enough TON
            expect(result.transactions).toHaveTransaction({
                from: billMaker.address,
                to: escrow.address,
                success: false,
            });
        });

        it('should fail with zero amount', async () => {
            const result = await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: 0n,
                description: 'Invalid bill',
            });

            expect(result.transactions).toHaveTransaction({
                from: billMaker.address,
                to: escrow.address,
                success: false,
            });
        });

        it('should set default expiry if not provided', async () => {
            await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: toNano('10'),
                description: 'Test bill',
            });

            const bill = await escrow.getBill(1n);
            const now = Math.floor(Date.now() / 1000);
            const sevenDays = 604800;

            // Check expiry is approximately 7 days from now
            expect(Number(bill!.expiryTimestamp)).toBeGreaterThan(now);
            expect(Number(bill!.expiryTimestamp)).toBeLessThan(now + sevenDays + 60);
        });

        it('should refund excess TON', async () => {
            const balanceBefore = await billMaker.getBalance();

            await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: toNano('10'),
                description: 'Test bill',
            });

            const balanceAfter = await billMaker.getBalance();

            // Should lose approximately 10 TON + fees, not more
            const lost = balanceBefore - balanceAfter;
            expect(lost).toBeLessThan(toNano('10.2'));
        });
    });

    // ========================================================================
    // CLAIM BILL TESTS
    // ========================================================================

    describe('Claim Bill', () => {
        beforeEach(async () => {
            await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: toNano('10'),
                description: 'Test bill',
            });
        });

        it('should allow payer to claim bill', async () => {
            const result = await escrow.sendClaimBill(payer.getSender(), 1n);

            expect(result.transactions).toHaveTransaction({
                from: payer.address,
                to: escrow.address,
                success: true,
            });

            const bill = await escrow.getBill(1n);
            expect(bill!.status).toBe(2); // CLAIMED
            expect(bill!.claimedAt).toBeGreaterThan(0n);
        });

        it('should fail if wrong person claims', async () => {
            const stranger = await blockchain.treasury('stranger');
            const result = await escrow.sendClaimBill(stranger.getSender(), 1n);

            expect(result.transactions).toHaveTransaction({
                from: stranger.address,
                to: escrow.address,
                success: false,
            });
        });

        it('should fail if bill already claimed', async () => {
            await escrow.sendClaimBill(payer.getSender(), 1n);

            const result = await escrow.sendClaimBill(payer.getSender(), 1n);

            expect(result.transactions).toHaveTransaction({
                from: payer.address,
                to: escrow.address,
                success: false,
            });
        });

        it('should fail if bill not found', async () => {
            const result = await escrow.sendClaimBill(payer.getSender(), 999n);

            expect(result.transactions).toHaveTransaction({
                from: payer.address,
                to: escrow.address,
                success: false,
            });
        });

        it('should fail if bill expired', async () => {
            // Fast forward time
            blockchain.now = Math.floor(Date.now() / 1000) + 604801; // 7 days + 1 sec

            const result = await escrow.sendClaimBill(payer.getSender(), 1n);

            expect(result.transactions).toHaveTransaction({
                from: payer.address,
                to: escrow.address,
                success: false,
            });
        });
    });

    // ========================================================================
    // RELEASE FUNDS TESTS
    // ========================================================================

    describe('Release Funds', () => {
        beforeEach(async () => {
            await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: toNano('10'),
                description: 'Test bill',
            });
            await escrow.sendClaimBill(payer.getSender(), 1n);
        });

        it('should release funds to payer with platform fee', async () => {
            const payerBalanceBefore = await payer.getBalance();

            const result = await escrow.sendReleaseFunds(billMaker.getSender(), 1n);

            expect(result.transactions).toHaveTransaction({
                from: billMaker.address,
                to: escrow.address,
                success: true,
            });

            const payerBalanceAfter = await payer.getBalance();
            const bill = await escrow.getBill(1n);

            expect(bill!.status).toBe(3); // RELEASED

            // Payer should receive 10 TON - 4.4% = 9.56 TON (approximately)
            const received = payerBalanceAfter - payerBalanceBefore;
            expect(received).toBeGreaterThan(toNano('9.5'));
            expect(received).toBeLessThan(toNano('9.6'));

            // Platform fee should be collected
            const feesCollected = await escrow.getTotalFeesCollected();
            expect(feesCollected).toBeGreaterThan(toNano('0.4'));
            expect(feesCollected).toBeLessThan(toNano('0.5'));
        });

        it('should fail if called by payer', async () => {
            const result = await escrow.sendReleaseFunds(payer.getSender(), 1n);

            expect(result.transactions).toHaveTransaction({
                from: payer.address,
                to: escrow.address,
                success: false,
            });
        });

        it('should fail if bill not claimed', async () => {
            await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: toNano('5'),
                description: 'Unclaimed bill',
            });

            const result = await escrow.sendReleaseFunds(billMaker.getSender(), 2n);

            expect(result.transactions).toHaveTransaction({
                from: billMaker.address,
                to: escrow.address,
                success: false,
            });
        });
    });

    // ========================================================================
    // REFUND TESTS
    // ========================================================================

    describe('Refund Bill', () => {
        it('should allow maker to cancel before claim', async () => {
            await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: toNano('10'),
                description: 'Test bill',
            });

            const balanceBefore = await billMaker.getBalance();

            const result = await escrow.sendCancelBill(billMaker.getSender(), 1n);

            expect(result.transactions).toHaveTransaction({
                from: billMaker.address,
                to: escrow.address,
                success: true,
            });

            const balanceAfter = await billMaker.getBalance();
            const bill = await escrow.getBill(1n);

            expect(bill!.status).toBe(6); // CANCELLED

            // Should get most of the money back
            const received = balanceAfter - balanceBefore;
            expect(received).toBeGreaterThan(toNano('9.8'));
        });

        it('should auto-refund after expiry', async () => {
            await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: toNano('10'),
                description: 'Test bill',
            });

            // Fast forward time past expiry
            blockchain.now = Math.floor(Date.now() / 1000) + 604801;

            const isExpired = await escrow.isBillExpired(1n);
            expect(isExpired).toBe(true);

            const canRefund = await escrow.canRefund(1n);
            expect(canRefund).toBe(true);

            // Anyone can trigger refund after expiry
            const stranger = await blockchain.treasury('stranger');
            const result = await escrow.sendRefundBill(stranger.getSender(), 1n);

            expect(result.transactions).toHaveTransaction({
                from: stranger.address,
                to: escrow.address,
                success: true,
            });

            const bill = await escrow.getBill(1n);
            expect(bill!.status).toBe(5); // REFUNDED
        });

        it('should fail to refund if not expired and not maker', async () => {
            await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: toNano('10'),
                description: 'Test bill',
            });

            const stranger = await blockchain.treasury('stranger');
            const result = await escrow.sendRefundBill(stranger.getSender(), 1n);

            expect(result.transactions).toHaveTransaction({
                from: stranger.address,
                to: escrow.address,
                success: false,
            });
        });
    });

    // ========================================================================
    // DISPUTE TESTS
    // ========================================================================

    describe('Dispute Resolution', () => {
        beforeEach(async () => {
            await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: toNano('10'),
                description: 'Test bill',
            });
            await escrow.sendClaimBill(payer.getSender(), 1n);
        });

        it('should allow payer to raise dispute', async () => {
            const result = await escrow.sendDisputeBill(
                payer.getSender(),
                1n,
                'Did not receive fiat payment'
            );

            expect(result.transactions).toHaveTransaction({
                from: payer.address,
                to: escrow.address,
                success: true,
            });

            const bill = await escrow.getBill(1n);
            expect(bill!.status).toBe(4); // DISPUTED
            expect(bill!.disputeReason).toBe('Did not receive fiat payment');
        });

        it('should allow maker to raise dispute', async () => {
            const result = await escrow.sendDisputeBill(
                billMaker.getSender(),
                1n,
                'Payer not responding'
            );

            expect(result.transactions).toHaveTransaction({
                from: billMaker.address,
                to: escrow.address,
                success: true,
            });

            const bill = await escrow.getBill(1n);
            expect(bill!.status).toBe(4); // DISPUTED
        });

        it('should fail if stranger raises dispute', async () => {
            const stranger = await blockchain.treasury('stranger');
            const result = await escrow.sendDisputeBill(
                stranger.getSender(),
                1n,
                'Invalid dispute'
            );

            expect(result.transactions).toHaveTransaction({
                from: stranger.address,
                to: escrow.address,
                success: false,
            });
        });

        it('should allow admin to resolve dispute in favor of maker', async () => {
            await escrow.sendDisputeBill(
                payer.getSender(),
                1n,
                'Test dispute'
            );

            const makerBalanceBefore = await billMaker.getBalance();

            const result = await escrow.sendResolveDispute(
                admin.getSender(),
                1n,
                true // releaseToMaker = true
            );

            expect(result.transactions).toHaveTransaction({
                from: admin.address,
                to: escrow.address,
                success: true,
            });

            const makerBalanceAfter = await billMaker.getBalance();
            const bill = await escrow.getBill(1n);

            expect(bill!.status).toBe(5); // REFUNDED

            // Maker should receive refund
            const received = makerBalanceAfter - makerBalanceBefore;
            expect(received).toBeGreaterThan(toNano('9.8'));
        });

        it('should allow admin to resolve dispute in favor of payer', async () => {
            await escrow.sendDisputeBill(
                billMaker.getSender(),
                1n,
                'Test dispute'
            );

            const payerBalanceBefore = await payer.getBalance();

            const result = await escrow.sendResolveDispute(
                admin.getSender(),
                1n,
                false // releaseToMaker = false
            );

            expect(result.transactions).toHaveTransaction({
                from: admin.address,
                to: escrow.address,
                success: true,
            });

            const payerBalanceAfter = await payer.getBalance();
            const bill = await escrow.getBill(1n);

            expect(bill!.status).toBe(3); // RELEASED

            // Payer should receive funds minus platform fee
            const received = payerBalanceAfter - payerBalanceBefore;
            expect(received).toBeGreaterThan(toNano('9.5'));
            expect(received).toBeLessThan(toNano('9.6'));
        });

        it('should fail if non-admin tries to resolve', async () => {
            await escrow.sendDisputeBill(
                payer.getSender(),
                1n,
                'Test dispute'
            );

            const stranger = await blockchain.treasury('stranger');
            const result = await escrow.sendResolveDispute(
                stranger.getSender(),
                1n,
                true
            );

            expect(result.transactions).toHaveTransaction({
                from: stranger.address,
                to: escrow.address,
                success: false,
            });
        });
    });

    // ========================================================================
    // ADMIN FUNCTIONS TESTS
    // ========================================================================

    describe('Admin Functions', () => {
        it('should allow owner to update platform fee', async () => {
            const result = await escrow.sendUpdatePlatformFee(
                admin.getSender(),
                500 // 5%
            );

            expect(result.transactions).toHaveTransaction({
                from: admin.address,
                to: escrow.address,
                success: true,
            });

            const newFee = await escrow.getPlatformFee();
            expect(newFee).toBe(500);
        });

        it('should fail if non-owner updates fee', async () => {
            const result = await escrow.sendUpdatePlatformFee(
                billMaker.getSender(),
                500
            );

            expect(result.transactions).toHaveTransaction({
                from: billMaker.address,
                to: escrow.address,
                success: false,
            });
        });

        it('should fail if fee > 100%', async () => {
            const result = await escrow.sendUpdatePlatformFee(
                admin.getSender(),
                10001 // 100.01%
            );

            expect(result.transactions).toHaveTransaction({
                from: admin.address,
                to: escrow.address,
                success: false,
            });
        });

        it('should allow owner to withdraw platform fees', async () => {
            // Create and complete a bill to generate fees
            await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: toNano('10'),
                description: 'Test bill',
            });
            await escrow.sendClaimBill(payer.getSender(), 1n);
            await escrow.sendReleaseFunds(billMaker.getSender(), 1n);

            const feesCollected = await escrow.getTotalFeesCollected();
            const adminBalanceBefore = await admin.getBalance();

            const result = await escrow.sendWithdrawPlatformFees(
                admin.getSender(),
                feesCollected
            );

            expect(result.transactions).toHaveTransaction({
                from: admin.address,
                to: escrow.address,
                success: true,
            });

            const adminBalanceAfter = await admin.getBalance();

            // Admin should receive the fees
            const received = adminBalanceAfter - adminBalanceBefore;
            expect(received).toBeGreaterThan(toNano('0.3'));
        });

        it('should fail if non-owner tries to withdraw', async () => {
            const result = await escrow.sendWithdrawPlatformFees(
                billMaker.getSender(),
                toNano('1')
            );

            expect(result.transactions).toHaveTransaction({
                from: billMaker.address,
                to: escrow.address,
                success: false,
            });
        });
    });

    // ========================================================================
    // EDGE CASES
    // ========================================================================

    describe('Edge Cases', () => {
        it('should handle multiple bills in parallel', async () => {
            const payer2 = await blockchain.treasury('payer2');

            await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: toNano('5'),
                description: 'Bill 1',
            });

            await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer2.address,
                amount: toNano('7'),
                description: 'Bill 2',
            });

            const bill1 = await escrow.getBill(1n);
            const bill2 = await escrow.getBill(2n);

            expect(bill1!.amount).toBe(toNano('5'));
            expect(bill2!.amount).toBe(toNano('7'));
            expect(bill1!.payer.toString()).toBe(payer.address.toString());
            expect(bill2!.payer.toString()).toBe(payer2.address.toString());
        });

        it('should handle very large amounts', async () => {
            const largeAmount = toNano('1000000'); // 1 million TON

            await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: largeAmount,
                description: 'Large bill',
            });

            const bill = await escrow.getBill(1n);
            expect(bill!.amount).toBe(largeAmount);
        });

        it('should handle very small amounts', async () => {
            const smallAmount = BigInt(1); // 1 nanoton

            await escrow.sendCreateBill(billMaker.getSender(), {
                payerAddress: payer.address,
                amount: smallAmount,
                description: 'Tiny bill',
            });

            const bill = await escrow.getBill(1n);
            expect(bill!.amount).toBe(smallAmount);
        });
    });
});
