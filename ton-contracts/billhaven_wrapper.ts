/**
 * BillHaven Escrow Smart Contract - TypeScript Wrapper
 *
 * This wrapper provides a convenient interface for interacting with the
 * BillHaven escrow smart contract from TypeScript/JavaScript applications.
 */

import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano,
    TupleBuilder,
} from '@ton/core';

// ============================================================================
// TYPES
// ============================================================================

export type BillStatus =
    | 'CREATED'
    | 'CLAIMED'
    | 'RELEASED'
    | 'DISPUTED'
    | 'REFUNDED'
    | 'CANCELLED';

export interface Bill {
    billId: bigint;
    maker: Address;
    payer: Address;
    amount: bigint;
    jettonWallet: Address | null;
    status: number;
    createdAt: bigint;
    expiryTimestamp: bigint;
    claimedAt: bigint;
    disputeReason: string | null;
}

// ============================================================================
// MESSAGE BUILDERS
// ============================================================================

export function createBillMessage(params: {
    billId: bigint;
    payerAddress: Address;
    amount: bigint;
    jettonWallet?: Address;
    expiryTimestamp: bigint;
    description: string;
}): Cell {
    return beginCell()
        .storeUint(0x01, 32) // opcode for CreateBill
        .storeUint(params.billId, 64)
        .storeAddress(params.payerAddress)
        .storeCoins(params.amount)
        .storeMaybeAddress(params.jettonWallet || null)
        .storeUint(params.expiryTimestamp, 64)
        .storeStringTail(params.description)
        .endCell();
}

export function claimBillMessage(billId: bigint, queryId: bigint = 0n): Cell {
    return beginCell()
        .storeUint(0x02, 32) // opcode for ClaimBill
        .storeUint(billId, 64)
        .storeUint(queryId, 64)
        .endCell();
}

export function releaseFundsMessage(billId: bigint, queryId: bigint = 0n): Cell {
    return beginCell()
        .storeUint(0x03, 32) // opcode for ReleaseFunds
        .storeUint(billId, 64)
        .storeUint(queryId, 64)
        .endCell();
}

export function refundBillMessage(billId: bigint, queryId: bigint = 0n): Cell {
    return beginCell()
        .storeUint(0x04, 32) // opcode for RefundBill
        .storeUint(billId, 64)
        .storeUint(queryId, 64)
        .endCell();
}

export function disputeBillMessage(
    billId: bigint,
    reason: string,
    queryId: bigint = 0n
): Cell {
    return beginCell()
        .storeUint(0x05, 32) // opcode for DisputeBill
        .storeUint(billId, 64)
        .storeStringTail(reason)
        .storeUint(queryId, 64)
        .endCell();
}

export function resolveDisputeMessage(
    billId: bigint,
    releaseToMaker: boolean,
    queryId: bigint = 0n
): Cell {
    return beginCell()
        .storeUint(0x06, 32) // opcode for ResolveDispute
        .storeUint(billId, 64)
        .storeBit(releaseToMaker)
        .storeUint(queryId, 64)
        .endCell();
}

export function cancelBillMessage(billId: bigint, queryId: bigint = 0n): Cell {
    return beginCell()
        .storeUint(0x07, 32) // opcode for CancelBill
        .storeUint(billId, 64)
        .storeUint(queryId, 64)
        .endCell();
}

export function updatePlatformFeeMessage(newFeeBasisPoints: number): Cell {
    return beginCell()
        .storeUint(0x08, 32) // opcode for UpdatePlatformFee
        .storeUint(newFeeBasisPoints, 16)
        .endCell();
}

export function withdrawPlatformFeesMessage(amount: bigint): Cell {
    return beginCell()
        .storeUint(0x09, 32) // opcode for WithdrawPlatformFees
        .storeCoins(amount)
        .endCell();
}

// ============================================================================
// CONTRACT CONFIG
// ============================================================================

export type BillHavenEscrowConfig = {
    owner: Address;
};

export function billHavenEscrowConfigToCell(config: BillHavenEscrowConfig): Cell {
    return beginCell()
        .storeAddress(config.owner)
        .storeUint(440, 16) // platformFeeBasisPoints (4.4%)
        .storeCoins(0) // totalPlatformFeesCollected
        .storeUint(1, 64) // nextBillId
        .storeDict(null) // bills map (empty initially)
        .endCell();
}

// ============================================================================
// CONTRACT CLASS
// ============================================================================

export class BillHavenEscrow implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new BillHavenEscrow(address);
    }

    static createFromConfig(
        config: BillHavenEscrowConfig,
        code: Cell,
        workchain = 0
    ) {
        const data = billHavenEscrowConfigToCell(config);
        const init = { code, data };
        return new BillHavenEscrow(contractAddress(workchain, init), init);
    }

    // ========================================================================
    // SEND METHODS
    // ========================================================================

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendCreateBill(
        provider: ContractProvider,
        via: Sender,
        params: {
            billId?: bigint; // 0 or undefined for auto-increment
            payerAddress: Address;
            amount: bigint;
            jettonWallet?: Address;
            expiryTimestamp?: bigint; // 0 or undefined for 7 days default
            description: string;
        }
    ) {
        const billId = params.billId || 0n;
        const expiryTimestamp = params.expiryTimestamp || 0n;
        const totalValue = params.amount + toNano('0.1'); // amount + operation fee

        await provider.internal(via, {
            value: totalValue,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: createBillMessage({
                billId,
                payerAddress: params.payerAddress,
                amount: params.amount,
                jettonWallet: params.jettonWallet,
                expiryTimestamp,
                description: params.description,
            }),
        });
    }

    async sendClaimBill(
        provider: ContractProvider,
        via: Sender,
        billId: bigint,
        queryId: bigint = 0n
    ) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: claimBillMessage(billId, queryId),
        });
    }

    async sendReleaseFunds(
        provider: ContractProvider,
        via: Sender,
        billId: bigint,
        queryId: bigint = 0n
    ) {
        await provider.internal(via, {
            value: toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: releaseFundsMessage(billId, queryId),
        });
    }

    async sendRefundBill(
        provider: ContractProvider,
        via: Sender,
        billId: bigint,
        queryId: bigint = 0n
    ) {
        await provider.internal(via, {
            value: toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: refundBillMessage(billId, queryId),
        });
    }

    async sendDisputeBill(
        provider: ContractProvider,
        via: Sender,
        billId: bigint,
        reason: string,
        queryId: bigint = 0n
    ) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: disputeBillMessage(billId, reason, queryId),
        });
    }

    async sendResolveDispute(
        provider: ContractProvider,
        via: Sender,
        billId: bigint,
        releaseToMaker: boolean,
        queryId: bigint = 0n
    ) {
        await provider.internal(via, {
            value: toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: resolveDisputeMessage(billId, releaseToMaker, queryId),
        });
    }

    async sendCancelBill(
        provider: ContractProvider,
        via: Sender,
        billId: bigint,
        queryId: bigint = 0n
    ) {
        await provider.internal(via, {
            value: toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: cancelBillMessage(billId, queryId),
        });
    }

    async sendUpdatePlatformFee(
        provider: ContractProvider,
        via: Sender,
        newFeeBasisPoints: number
    ) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: updatePlatformFeeMessage(newFeeBasisPoints),
        });
    }

    async sendWithdrawPlatformFees(
        provider: ContractProvider,
        via: Sender,
        amount: bigint
    ) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: withdrawPlatformFeesMessage(amount),
        });
    }

    // ========================================================================
    // GET METHODS
    // ========================================================================

    async getBill(provider: ContractProvider, billId: bigint): Promise<Bill | null> {
        const result = await provider.get('getBill', [
            { type: 'int', value: billId },
        ]);

        if (result.stack.remaining === 0) {
            return null;
        }

        // Parse Bill struct from stack
        // Note: Adjust based on actual Tact compilation output
        const tuple = result.stack.readTuple();

        return {
            billId: tuple.readBigNumber(),
            maker: tuple.readAddress(),
            payer: tuple.readAddress(),
            amount: tuple.readBigNumber(),
            jettonWallet: tuple.readAddressOpt(),
            status: tuple.readNumber(),
            createdAt: tuple.readBigNumber(),
            expiryTimestamp: tuple.readBigNumber(),
            claimedAt: tuple.readBigNumber(),
            disputeReason: tuple.readStringOpt(),
        };
    }

    async getPlatformFee(provider: ContractProvider): Promise<number> {
        const result = await provider.get('getPlatformFee', []);
        return result.stack.readNumber();
    }

    async getTotalFeesCollected(provider: ContractProvider): Promise<bigint> {
        const result = await provider.get('getTotalFeesCollected', []);
        return result.stack.readBigNumber();
    }

    async getNextBillId(provider: ContractProvider): Promise<bigint> {
        const result = await provider.get('getNextBillId', []);
        return result.stack.readBigNumber();
    }

    async getContractBalance(provider: ContractProvider): Promise<bigint> {
        const result = await provider.get('getContractBalance', []);
        return result.stack.readBigNumber();
    }

    async isBillExpired(
        provider: ContractProvider,
        billId: bigint
    ): Promise<boolean> {
        const result = await provider.get('isBillExpired', [
            { type: 'int', value: billId },
        ]);
        return result.stack.readBoolean();
    }

    async canRefund(provider: ContractProvider, billId: bigint): Promise<boolean> {
        const result = await provider.get('canRefund', [
            { type: 'int', value: billId },
        ]);
        return result.stack.readBoolean();
    }

    async getOwner(provider: ContractProvider): Promise<Address> {
        const result = await provider.get('owner', []);
        return result.stack.readAddress();
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getStatusName(statusCode: number): BillStatus {
    const statuses: { [key: number]: BillStatus } = {
        1: 'CREATED',
        2: 'CLAIMED',
        3: 'RELEASED',
        4: 'DISPUTED',
        5: 'REFUNDED',
        6: 'CANCELLED',
    };
    return statuses[statusCode] || 'CREATED';
}

export function calculatePlatformFee(
    amount: bigint,
    feeBasisPoints: number
): bigint {
    return (amount * BigInt(feeBasisPoints)) / 10000n;
}

export function calculatePayerAmount(
    amount: bigint,
    feeBasisPoints: number
): bigint {
    const fee = calculatePlatformFee(amount, feeBasisPoints);
    return amount - fee;
}

export function getDefaultExpiry(daysFromNow: number = 7): bigint {
    const nowSeconds = Math.floor(Date.now() / 1000);
    return BigInt(nowSeconds + daysFromNow * 24 * 60 * 60);
}

export function generateQueryId(): bigint {
    return BigInt(Math.floor(Math.random() * 1000000000));
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
import { TonClient, WalletContractV4 } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

async function example() {
    // Connect to TON
    const client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    });

    // Create wallet
    const mnemonic = 'your mnemonic here'.split(' ');
    const keyPair = await mnemonicToPrivateKey(mnemonic);
    const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey,
    });

    // Open contract
    const escrowAddress = Address.parse('EQC...');
    const escrow = client.open(BillHavenEscrow.createFromAddress(escrowAddress));

    // Create a bill
    await escrow.sendCreateBill(wallet.sender(keyPair.secretKey), {
        payerAddress: Address.parse('EQD...'),
        amount: toNano('10'), // 10 TON
        description: 'Electricity bill payment',
        expiryTimestamp: getDefaultExpiry(7),
    });

    // Check bill
    const bill = await escrow.getBill(1n);
    console.log('Bill status:', getStatusName(bill.status));

    // Claim bill (as payer)
    await escrow.sendClaimBill(wallet.sender(keyPair.secretKey), 1n);

    // Release funds (as maker after receiving fiat)
    await escrow.sendReleaseFunds(wallet.sender(keyPair.secretKey), 1n);
}
*/
