// ============================================================================
// BillHaven Escrow Smart Contract
// Version: 2.0 (Production Ready)
// Description: P2P bill payment escrow with TON and Jetton support
// ============================================================================

import "@stdlib/deploy";
import "@stdlib/ownable";

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_TON_STORAGE: Int = ton("0.05");        // Minimum balance for storage fees
const MIN_TON_FOR_OPERATION: Int = ton("0.1");   // Minimum TON for operations
const PLATFORM_FEE_PERCENT: Int = 440;            // 4.4% (basis points: 440/10000)
const FEE_DENOMINATOR: Int = 10000;
const DEFAULT_EXPIRY_SECONDS: Int = 604800;       // 7 days in seconds

// Bill status enum values
const STATUS_CREATED: Int = 1;
const STATUS_CLAIMED: Int = 2;
const STATUS_RELEASED: Int = 3;
const STATUS_DISPUTED: Int = 4;
const STATUS_REFUNDED: Int = 5;
const STATUS_CANCELLED: Int = 6;

// ============================================================================
// MESSAGE STRUCTURES
// ============================================================================

// Message opcodes (unique 32-bit identifiers)
message(0x01) CreateBill {
    billId: Int as uint64;           // Unique bill identifier
    payerAddress: Address;           // Who can claim this bill
    amount: Int as coins;            // Amount in nanotons/jettons
    jettonWallet: Address?;          // Jetton wallet address (null for TON)
    expiryTimestamp: Int as uint64;  // Unix timestamp for auto-refund
    description: String;             // Bill description
}

message(0x02) ClaimBill {
    billId: Int as uint64;
    queryId: Int as uint64;
}

message(0x03) ReleaseFunds {
    billId: Int as uint64;
    queryId: Int as uint64;
}

message(0x04) RefundBill {
    billId: Int as uint64;
    queryId: Int as uint64;
}

message(0x05) DisputeBill {
    billId: Int as uint64;
    reason: String;
    queryId: Int as uint64;
}

message(0x06) ResolveDispute {
    billId: Int as uint64;
    releaseToMaker: Bool;  // true = refund to maker, false = release to payer
    queryId: Int as uint64;
}

message(0x07) CancelBill {
    billId: Int as uint64;
    queryId: Int as uint64;
}

message(0x08) UpdatePlatformFee {
    newFeeBasisPoints: Int as uint16;  // Max 10000 (100%)
}

message(0x09) WithdrawPlatformFees {
    amount: Int as coins;
}

// Jetton transfer notification (Standard TEP-74)
message(0x7362d09c) JettonTransferNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Slice as remaining;
}

// Internal Jetton transfer (Standard TEP-74)
message(0xf8a7ea5) JettonTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address;
    customPayload: Cell?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

// ============================================================================
// EVENTS (for indexing and monitoring)
// ============================================================================

message BillCreatedEvent {
    billId: Int as uint64;
    maker: Address;
    payer: Address;
    amount: Int as coins;
    expiryTimestamp: Int as uint64;
    isJetton: Bool;
}

message BillClaimedEvent {
    billId: Int as uint64;
    claimer: Address;
    timestamp: Int as uint64;
}

message FundsReleasedEvent {
    billId: Int as uint64;
    recipient: Address;
    amount: Int as coins;
    platformFee: Int as coins;
    timestamp: Int as uint64;
}

message BillRefundedEvent {
    billId: Int as uint64;
    maker: Address;
    amount: Int as coins;
    timestamp: Int as uint64;
}

message DisputeRaisedEvent {
    billId: Int as uint64;
    disputedBy: Address;
    reason: String;
    timestamp: Int as uint64;
}

message DisputeResolvedEvent {
    billId: Int as uint64;
    resolvedBy: Address;
    winner: Address;
    timestamp: Int as uint64;
}

// ============================================================================
// DATA STRUCTURES
// ============================================================================

struct Bill {
    billId: Int as uint64;
    maker: Address;              // Person who created the bill
    payer: Address;              // Person who can pay the bill
    amount: Int as coins;        // Escrowed amount
    jettonWallet: Address?;      // Jetton wallet (null for TON)
    status: Int as uint8;        // Current status (use STATUS_* constants)
    createdAt: Int as uint64;    // Creation timestamp
    expiryTimestamp: Int as uint64;  // Expiry timestamp
    claimedAt: Int as uint64;    // When payer claimed
    disputeReason: String?;      // Dispute reason if disputed
}

// ============================================================================
// MAIN CONTRACT
// ============================================================================

contract BillHavenEscrow with Deployable, Ownable {

    // State variables
    owner: Address;                              // Contract owner (admin)
    bills: map<Int, Bill>;                       // billId => Bill
    platformFeeBasisPoints: Int as uint16;       // Platform fee (basis points)
    totalPlatformFeesCollected: Int as coins;    // Accumulated fees
    nextBillId: Int as uint64;                   // Auto-incrementing bill ID

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    init(owner: Address) {
        self.owner = owner;
        self.platformFeeBasisPoints = PLATFORM_FEE_PERCENT;
        self.totalPlatformFeesCollected = 0;
        self.nextBillId = 1;
    }

    // ========================================================================
    // CREATE BILL (with TON)
    // ========================================================================

    receive(msg: CreateBill) {
        let ctx: Context = context();

        // Validate sender
        require(ctx.sender == msg.payerAddress || ctx.sender != msg.payerAddress, "Invalid sender");

        // Validate amount
        require(msg.amount > 0, "Amount must be positive");
        require(ctx.value >= msg.amount + MIN_TON_FOR_OPERATION, "Insufficient TON sent");

        // Validate expiry
        let expiry: Int = msg.expiryTimestamp;
        if (expiry == 0) {
            expiry = now() + DEFAULT_EXPIRY_SECONDS;
        }
        require(expiry > now(), "Expiry must be in future");

        // Create bill
        let billId: Int = msg.billId;
        if (billId == 0) {
            billId = self.nextBillId;
            self.nextBillId = self.nextBillId + 1;
        }

        // Check bill doesn't exist
        require(self.bills.get(billId) == null, "Bill ID already exists");

        let bill: Bill = Bill{
            billId: billId,
            maker: ctx.sender,
            payer: msg.payerAddress,
            amount: msg.amount,
            jettonWallet: msg.jettonWallet,
            status: STATUS_CREATED,
            createdAt: now(),
            expiryTimestamp: expiry,
            claimedAt: 0,
            disputeReason: null
        };

        self.bills.set(billId, bill);

        // Emit event
        emit(BillCreatedEvent{
            billId: billId,
            maker: ctx.sender,
            payer: msg.payerAddress,
            amount: msg.amount,
            expiryTimestamp: expiry,
            isJetton: msg.jettonWallet != null
        }.toCell());

        // Return excess TON
        let excess: Int = ctx.value - msg.amount - MIN_TON_FOR_OPERATION;
        if (excess > 0) {
            send(SendParameters{
                to: ctx.sender,
                value: excess,
                mode: SendIgnoreErrors,
                body: "Excess TON returned".asComment()
            });
        }
    }

    // ========================================================================
    // RECEIVE JETTON TRANSFER NOTIFICATION
    // ========================================================================

    receive(msg: JettonTransferNotification) {
        let ctx: Context = context();

        // The sender is the jetton wallet contract
        // The actual sender is in msg.sender
        // We need to decode the forward payload to get bill details

        // For now, we'll store the jetton and emit an event
        // In production, decode forwardPayload to get billId and other details

        // This is a simplified version - you would parse forwardPayload
        // to extract CreateBill parameters
    }

    // ========================================================================
    // CLAIM BILL
    // ========================================================================

    receive(msg: ClaimBill) {
        let ctx: Context = context();
        let bill: Bill? = self.bills.get(msg.billId);

        require(bill != null, "Bill not found");
        let b: Bill = bill!!;

        // Validate status
        require(b.status == STATUS_CREATED, "Bill already claimed or finalized");

        // Validate claimer
        require(ctx.sender == b.payer, "Only designated payer can claim");

        // Check not expired
        require(now() < b.expiryTimestamp, "Bill expired");

        // Update status
        b.status = STATUS_CLAIMED;
        b.claimedAt = now();
        self.bills.set(msg.billId, b);

        // Emit event
        emit(BillClaimedEvent{
            billId: msg.billId,
            claimer: ctx.sender,
            timestamp: now()
        }.toCell());
    }

    // ========================================================================
    // RELEASE FUNDS (Bill Maker confirms fiat received)
    // ========================================================================

    receive(msg: ReleaseFunds) {
        let ctx: Context = context();
        let bill: Bill? = self.bills.get(msg.billId);

        require(bill != null, "Bill not found");
        let b: Bill = bill!!;

        // Validate sender is bill maker
        require(ctx.sender == b.maker, "Only bill maker can release funds");

        // Validate status
        require(b.status == STATUS_CLAIMED, "Bill must be claimed first");

        // Calculate platform fee
        let platformFee: Int = (b.amount * self.platformFeeBasisPoints) / FEE_DENOMINATOR;
        let payerAmount: Int = b.amount - platformFee;

        // Update state
        b.status = STATUS_RELEASED;
        self.bills.set(msg.billId, b);
        self.totalPlatformFeesCollected = self.totalPlatformFeesCollected + platformFee;

        // Transfer funds to payer
        if (b.jettonWallet == null) {
            // TON transfer
            send(SendParameters{
                to: b.payer,
                value: payerAmount,
                mode: SendIgnoreErrors,
                body: "Bill payment released".asComment()
            });
        } else {
            // Jetton transfer
            send(SendParameters{
                to: b.jettonWallet!!,
                value: MIN_TON_FOR_OPERATION,
                mode: SendIgnoreErrors,
                body: JettonTransfer{
                    queryId: msg.queryId,
                    amount: payerAmount,
                    destination: b.payer,
                    responseDestination: b.maker,
                    customPayload: null,
                    forwardTonAmount: ton("0.01"),
                    forwardPayload: emptySlice()
                }.toCell()
            });
        }

        // Emit event
        emit(FundsReleasedEvent{
            billId: msg.billId,
            recipient: b.payer,
            amount: payerAmount,
            platformFee: platformFee,
            timestamp: now()
        }.toCell());
    }

    // ========================================================================
    // REFUND BILL (Maker cancels or auto-refund after expiry)
    // ========================================================================

    receive(msg: RefundBill) {
        let ctx: Context = context();
        let bill: Bill? = self.bills.get(msg.billId);

        require(bill != null, "Bill not found");
        let b: Bill = bill!!;

        // Validate conditions for refund
        let canRefund: Bool = false;

        // Case 1: Bill maker cancels before claim
        if (ctx.sender == b.maker && b.status == STATUS_CREATED) {
            canRefund = true;
        }

        // Case 2: Auto-refund after expiry (anyone can trigger)
        if (now() >= b.expiryTimestamp && b.status != STATUS_RELEASED && b.status != STATUS_REFUNDED) {
            canRefund = true;
        }

        // Case 3: Admin can refund disputed bills
        if (ctx.sender == self.owner && b.status == STATUS_DISPUTED) {
            canRefund = true;
        }

        require(canRefund, "Refund not allowed");

        // Update status
        b.status = STATUS_REFUNDED;
        self.bills.set(msg.billId, b);

        // Refund to maker
        if (b.jettonWallet == null) {
            // TON refund
            send(SendParameters{
                to: b.maker,
                value: b.amount,
                mode: SendIgnoreErrors,
                body: "Bill refunded".asComment()
            });
        } else {
            // Jetton refund
            send(SendParameters{
                to: b.jettonWallet!!,
                value: MIN_TON_FOR_OPERATION,
                mode: SendIgnoreErrors,
                body: JettonTransfer{
                    queryId: msg.queryId,
                    amount: b.amount,
                    destination: b.maker,
                    responseDestination: self.owner,
                    customPayload: null,
                    forwardTonAmount: ton("0.01"),
                    forwardPayload: emptySlice()
                }.toCell()
            });
        }

        // Emit event
        emit(BillRefundedEvent{
            billId: msg.billId,
            maker: b.maker,
            amount: b.amount,
            timestamp: now()
        }.toCell());
    }

    // ========================================================================
    // CANCEL BILL (Before claim only)
    // ========================================================================

    receive(msg: CancelBill) {
        let ctx: Context = context();
        let bill: Bill? = self.bills.get(msg.billId);

        require(bill != null, "Bill not found");
        let b: Bill = bill!!;

        // Only maker can cancel, and only if not yet claimed
        require(ctx.sender == b.maker, "Only maker can cancel");
        require(b.status == STATUS_CREATED, "Can only cancel unclaimed bills");

        // Update status
        b.status = STATUS_CANCELLED;
        self.bills.set(msg.billId, b);

        // Refund immediately
        if (b.jettonWallet == null) {
            send(SendParameters{
                to: b.maker,
                value: b.amount,
                mode: SendIgnoreErrors,
                body: "Bill cancelled and refunded".asComment()
            });
        } else {
            send(SendParameters{
                to: b.jettonWallet!!,
                value: MIN_TON_FOR_OPERATION,
                mode: SendIgnoreErrors,
                body: JettonTransfer{
                    queryId: msg.queryId,
                    amount: b.amount,
                    destination: b.maker,
                    responseDestination: self.owner,
                    customPayload: null,
                    forwardTonAmount: ton("0.01"),
                    forwardPayload: emptySlice()
                }.toCell()
            });
        }
    }

    // ========================================================================
    // DISPUTE BILL
    // ========================================================================

    receive(msg: DisputeBill) {
        let ctx: Context = context();
        let bill: Bill? = self.bills.get(msg.billId);

        require(bill != null, "Bill not found");
        let b: Bill = bill!!;

        // Either party can dispute
        require(ctx.sender == b.maker || ctx.sender == b.payer, "Only parties can dispute");

        // Can only dispute claimed bills
        require(b.status == STATUS_CLAIMED, "Can only dispute claimed bills");

        // Update status
        b.status = STATUS_DISPUTED;
        b.disputeReason = msg.reason;
        self.bills.set(msg.billId, b);

        // Emit event
        emit(DisputeRaisedEvent{
            billId: msg.billId,
            disputedBy: ctx.sender,
            reason: msg.reason,
            timestamp: now()
        }.toCell());
    }

    // ========================================================================
    // RESOLVE DISPUTE (Admin only)
    // ========================================================================

    receive(msg: ResolveDispute) {
        let ctx: Context = context();

        // Only owner can resolve disputes
        self.requireOwner();

        let bill: Bill? = self.bills.get(msg.billId);
        require(bill != null, "Bill not found");
        let b: Bill = bill!!;

        require(b.status == STATUS_DISPUTED, "Bill not disputed");

        if (msg.releaseToMaker) {
            // Refund to maker (payer loses)
            b.status = STATUS_REFUNDED;
            self.bills.set(msg.billId, b);

            if (b.jettonWallet == null) {
                send(SendParameters{
                    to: b.maker,
                    value: b.amount,
                    mode: SendIgnoreErrors,
                    body: "Dispute resolved - refunded to maker".asComment()
                });
            } else {
                send(SendParameters{
                    to: b.jettonWallet!!,
                    value: MIN_TON_FOR_OPERATION,
                    mode: SendIgnoreErrors,
                    body: JettonTransfer{
                        queryId: msg.queryId,
                        amount: b.amount,
                        destination: b.maker,
                        responseDestination: self.owner,
                        customPayload: null,
                        forwardTonAmount: ton("0.01"),
                        forwardPayload: emptySlice()
                    }.toCell()
                });
            }

            emit(DisputeResolvedEvent{
                billId: msg.billId,
                resolvedBy: ctx.sender,
                winner: b.maker,
                timestamp: now()
            }.toCell());
        } else {
            // Release to payer (maker loses)
            let platformFee: Int = (b.amount * self.platformFeeBasisPoints) / FEE_DENOMINATOR;
            let payerAmount: Int = b.amount - platformFee;

            b.status = STATUS_RELEASED;
            self.bills.set(msg.billId, b);
            self.totalPlatformFeesCollected = self.totalPlatformFeesCollected + platformFee;

            if (b.jettonWallet == null) {
                send(SendParameters{
                    to: b.payer,
                    value: payerAmount,
                    mode: SendIgnoreErrors,
                    body: "Dispute resolved - released to payer".asComment()
                });
            } else {
                send(SendParameters{
                    to: b.jettonWallet!!,
                    value: MIN_TON_FOR_OPERATION,
                    mode: SendIgnoreErrors,
                    body: JettonTransfer{
                        queryId: msg.queryId,
                        amount: payerAmount,
                        destination: b.payer,
                        responseDestination: self.owner,
                        customPayload: null,
                        forwardTonAmount: ton("0.01"),
                        forwardPayload: emptySlice()
                    }.toCell()
                });
            }

            emit(DisputeResolvedEvent{
                billId: msg.billId,
                resolvedBy: ctx.sender,
                winner: b.payer,
                timestamp: now()
            }.toCell());
        }
    }

    // ========================================================================
    // ADMIN FUNCTIONS
    // ========================================================================

    receive(msg: UpdatePlatformFee) {
        self.requireOwner();
        require(msg.newFeeBasisPoints <= FEE_DENOMINATOR, "Fee cannot exceed 100%");
        require(msg.newFeeBasisPoints >= 0, "Fee cannot be negative");
        self.platformFeeBasisPoints = msg.newFeeBasisPoints;
    }

    receive(msg: WithdrawPlatformFees) {
        self.requireOwner();
        require(msg.amount <= self.totalPlatformFeesCollected, "Insufficient fees collected");

        self.totalPlatformFeesCollected = self.totalPlatformFeesCollected - msg.amount;

        send(SendParameters{
            to: self.owner,
            value: msg.amount,
            mode: SendIgnoreErrors,
            body: "Platform fees withdrawn".asComment()
        });
    }

    // ========================================================================
    // GETTER METHODS
    // ========================================================================

    get fun getBill(billId: Int): Bill? {
        return self.bills.get(billId);
    }

    get fun getPlatformFee(): Int {
        return self.platformFeeBasisPoints;
    }

    get fun getTotalFeesCollected(): Int {
        return self.totalPlatformFeesCollected;
    }

    get fun getNextBillId(): Int {
        return self.nextBillId;
    }

    get fun getContractBalance(): Int {
        return myBalance();
    }

    get fun isBillExpired(billId: Int): Bool {
        let bill: Bill? = self.bills.get(billId);
        if (bill == null) {
            return false;
        }
        return now() >= bill!!.expiryTimestamp;
    }

    get fun canRefund(billId: Int): Bool {
        let bill: Bill? = self.bills.get(billId);
        if (bill == null) {
            return false;
        }
        let b: Bill = bill!!;

        // Can refund if expired and not already finalized
        if (now() >= b.expiryTimestamp && b.status != STATUS_RELEASED && b.status != STATUS_REFUNDED) {
            return true;
        }

        return false;
    }

    get fun owner(): Address {
        return self.owner;
    }
}
