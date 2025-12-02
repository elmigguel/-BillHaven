# CRITICAL SECURITY FIXES REQUIRED - BillHavenEscrowV4

## 🚨 DO NOT DEPLOY WITHOUT FIXING THESE ISSUES 🚨

**Date:** 2025-12-02
**Contract:** BillHavenEscrowV4.sol
**Status:** ⚠️ NOT PRODUCTION READY
**Security Score:** 6.5/10

---

## CRITICAL-1: Signature Replay Attack Vulnerability

**File:** `contracts/BillHavenEscrowV4.sol`
**Line:** 456-463
**Severity:** CRITICAL 🔴

### The Problem:
```solidity
// VULNERABLE CODE (Lines 456-463)
bytes32 messageHash = keccak256(abi.encodePacked(
    _billId,
    bill.payer,
    bill.billMaker,
    _fiatAmount,
    _paymentReference,
    _timestamp
));
// Missing: block.chainid, address(this)
```

**Attack:** Attacker can replay Oracle signatures across different chains or contract instances.

### The Fix:
```solidity
// SECURE CODE (Add these lines)
bytes32 messageHash = keccak256(abi.encodePacked(
    block.chainid,        // ← ADD THIS (prevents cross-chain replay)
    address(this),        // ← ADD THIS (prevents cross-contract replay)
    _billId,
    bill.payer,
    bill.billMaker,
    _fiatAmount,
    _paymentReference,
    _timestamp
));
```

### Backend Oracle Must Update Signature Too:
```javascript
// Backend webhook signature generation
const messageHash = ethers.solidityPackedKeccak256(
    ['uint256', 'address', 'uint256', 'address', 'address', 'uint256', 'bytes32', 'uint256'],
    [
        CHAIN_ID,              // ← ADD THIS
        CONTRACT_ADDRESS,      // ← ADD THIS
        billId,
        payerAddress,
        makerAddress,
        fiatAmountInCents,
        paymentReference,
        timestamp
    ]
);

const signature = await oracleWallet.signMessage(ethers.getBytes(messageHash));
```

---

## HIGH-2: Add Signature Nonce to Prevent Replay

**File:** `contracts/BillHavenEscrowV4.sol`
**Line:** 440-495
**Severity:** HIGH 🟠

### The Problem:
Even with chainId, signatures can be reused within 1-hour window if Oracle key is compromised.

### The Fix:

**Step 1:** Add nonce mapping (after line 153):
```solidity
mapping(bytes32 => bool) public usedSignatures;
```

**Step 2:** Update verifyPaymentReceived() (after line 468):
```solidity
bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
address signer = ethSignedHash.recover(_signature);

if (!trustedOracles[signer]) revert InvalidSignature();

// ADD THIS: Prevent signature replay
bytes32 signatureHash = keccak256(_signature);
if (usedSignatures[signatureHash]) revert PaymentReferenceUsed(); // Reuse existing error
usedSignatures[signatureHash] = true;

// Rest of the function...
```

---

## MEDIUM-1: Implement Multi-Oracle Verification

**File:** `contracts/BillHavenEscrowV4.sol`
**Severity:** MEDIUM 🟡 (but HIGHLY RECOMMENDED)

### The Problem:
Single Oracle = single point of failure. If Oracle key is compromised, all escrows at risk.

### The Solution:
Require 2-of-3 Oracle signatures for payment verification.

**Step 1:** Add data structures (after line 153):
```solidity
struct OracleVerification {
    mapping(address => bool) hasConfirmed;
    uint256 confirmationCount;
}

mapping(uint256 => OracleVerification) public oracleVerifications;
uint256 public requiredOracleConfirmations = 2; // 2 of 3 Oracles must confirm
```

**Step 2:** Update verifyPaymentReceived() logic:
```solidity
function verifyPaymentReceived(
    uint256 _billId,
    bytes32 _paymentReference,
    uint256 _fiatAmount,
    uint256 _timestamp,
    bytes calldata _signature
) external nonReentrant whenNotPaused {
    Bill storage bill = bills[_billId];

    if (bill.status != ConfirmationStatus.PAYMENT_SENT) revert InvalidState();
    if (bill.paymentReference != _paymentReference) revert InvalidSignature();
    if (bill.fiatAmount != _fiatAmount) revert InvalidAmount();
    if (_timestamp > block.timestamp) revert InvalidSignature();
    if (_timestamp < block.timestamp - 5 minutes) revert InvalidSignature(); // Reduced from 1 hour

    // Verify signature
    bytes32 messageHash = keccak256(abi.encodePacked(
        block.chainid,
        address(this),
        _billId,
        bill.payer,
        bill.billMaker,
        _fiatAmount,
        _paymentReference,
        _timestamp
    ));

    bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
    address signer = ethSignedHash.recover(_signature);

    if (!trustedOracles[signer]) revert InvalidSignature();

    // Prevent signature replay
    bytes32 signatureHash = keccak256(_signature);
    if (usedSignatures[signatureHash]) revert PaymentReferenceUsed();
    usedSignatures[signatureHash] = true;

    // Track Oracle confirmations
    OracleVerification storage verification = oracleVerifications[_billId];

    if (!verification.hasConfirmed[signer]) {
        verification.hasConfirmed[signer] = true;
        verification.confirmationCount++;
    }

    emit PaymentVerified(_billId, signer, true);

    // Only mark as verified once threshold is reached
    if (verification.confirmationCount >= requiredOracleConfirmations) {
        bill.oracleVerified = true;
        bill.status = ConfirmationStatus.PAYMENT_VERIFIED;
        bill.verifiedAt = block.timestamp;

        // Calculate hold period
        uint256 methodHoldPeriod = holdPeriods[bill.paymentMethod];
        uint256 effectiveHoldPeriod = methodHoldPeriod > MIN_SECURITY_DELAY
            ? methodHoldPeriod
            : MIN_SECURITY_DELAY;

        if (bill.paymentMethod == PaymentMethod.CRYPTO) {
            effectiveHoldPeriod = 0;
        }

        bill.releaseTime = block.timestamp + effectiveHoldPeriod;

        if (effectiveHoldPeriod == 0) {
            bill.status = ConfirmationStatus.HOLD_COMPLETE;
            emit HoldPeriodComplete(_billId, bill.releaseTime);
        }
    }
}
```

**Step 3:** Add admin function to adjust threshold:
```solidity
function setRequiredOracleConfirmations(uint256 _required) external onlyRole(ADMIN_ROLE) {
    require(_required > 0 && _required <= 5, "Invalid confirmation count");
    requiredOracleConfirmations = _required;
}
```

---

## MEDIUM-2: Add Gas Griefing Protection

**File:** `contracts/BillHavenEscrowV4.sol`
**Line:** 730-741
**Severity:** MEDIUM 🟡

### The Problem:
Malicious payer can revert transfer, locking funds forever.

### The Fix:

**Step 1:** Add pending withdrawals mapping (after line 153):
```solidity
mapping(address => uint256) public pendingWithdrawals;
```

**Step 2:** Update _releaseFunds() with gas limits:
```solidity
function _releaseFunds(uint256 _billId) internal {
    Bill storage bill = bills[_billId];

    if (!bill.oracleVerified) revert PaymentNotOracleVerified();

    uint256 payerAmount = bill.amount;
    uint256 feeAmount = bill.platformFee;
    address token = bill.token;
    address payer = bill.payer;

    // Clear amounts before transfer (reentrancy protection)
    bill.amount = 0;
    bill.platformFee = 0;
    bill.status = ConfirmationStatus.RELEASED;

    // Transfer to payer with gas limit
    if (token == address(0)) {
        // NATIVE TOKEN: Use gas-limited call
        (bool payerSuccess, ) = payable(payer).call{value: payerAmount, gas: 10000}("");

        if (!payerSuccess) {
            // If transfer fails, add to pending withdrawals
            pendingWithdrawals[payer] += payerAmount;
            emit TransferFailed(_billId, payer, payerAmount);
        }

        if (feeAmount > 0) {
            (bool feeSuccess, ) = payable(feeWallet).call{value: feeAmount, gas: 10000}("");
            if (!feeSuccess) {
                pendingWithdrawals[feeWallet] += feeAmount;
            }
        }
    } else {
        // ERC20 TOKEN: SafeTransfer handles failures
        IERC20(token).safeTransfer(payer, payerAmount);
        if (feeAmount > 0) {
            IERC20(token).safeTransfer(feeWallet, feeAmount);
        }
    }

    // Record successful trades
    _recordSuccessfulTrade(bill.billMaker);
    _recordSuccessfulTrade(payer);

    emit CryptoReleased(_billId, payer, payerAmount, feeAmount);
}
```

**Step 3:** Add withdrawal function for failed transfers:
```solidity
/**
 * @notice Withdraw pending funds (for failed push transfers)
 */
function withdrawPending() external nonReentrant {
    uint256 amount = pendingWithdrawals[msg.sender];
    require(amount > 0, "No pending withdrawals");

    pendingWithdrawals[msg.sender] = 0;

    (bool success, ) = payable(msg.sender).call{value: amount}("");
    require(success, "Withdrawal failed");
}
```

**Step 4:** Add new error and event:
```solidity
// Add to errors section (after line 214)
error TransferFailed();

// Add to events section (after line 190)
event TransferFailed(uint256 indexed billId, address indexed recipient, uint256 amount);
```

---

## SUMMARY OF CHANGES NEEDED

### Files to Modify:
1. `/home/elmigguel/BillHaven/contracts/BillHavenEscrowV4.sol`
2. Backend Oracle service (Node.js webhook handler)

### Lines to Update in Solidity:
- Line 153: Add new mappings (`usedSignatures`, `oracleVerifications`, `pendingWithdrawals`)
- Line 192: Add new events (`TransferFailed`)
- Line 214: Add new errors (`TransferFailed`)
- Line 456-463: Fix signature hash (add `block.chainid` and `address(this)`)
- Line 468: Add signature nonce check
- Line 730-741: Add gas limits and pending withdrawals
- After line 1160: Add `withdrawPending()` function

### Backend Changes Required:
- Update Oracle signature generation to include `chainId` and `contractAddress`
- Update webhook verification to match new signature format
- Deploy 3 Oracle wallets for multi-sig (optional but recommended)

---

## TESTING CHECKLIST

Before deployment, test these scenarios:

### Critical Tests:
- [ ] Signature replay on different chains (should fail)
- [ ] Signature replay on same chain (should fail)
- [ ] Signature reuse with same nonce (should fail)
- [ ] Multi-Oracle verification with 1 signature (should not release)
- [ ] Multi-Oracle verification with 2 signatures (should release)
- [ ] Malicious payer contract that reverts (should use pending withdrawals)

### Edge Case Tests:
- [ ] Oracle key compromise scenario
- [ ] Front-running payment reference
- [ ] Timestamp manipulation attempts
- [ ] Large bill with gas griefing
- [ ] Cross-contract attack attempts

---

## DEPLOYMENT ORDER

1. Fix all CRITICAL issues
2. Deploy to testnet (Sepolia/Mumbai)
3. Test with malicious contracts
4. Get external security audit
5. Fix any additional findings
6. Deploy to mainnet with timelock
7. Launch bug bounty program
8. Monitor for 30 days before large volumes

---

## ESTIMATED TIMELINE

- **Fixes Implementation:** 2-3 hours
- **Testing:** 1-2 days
- **External Audit:** 1-2 weeks
- **Testnet Deployment:** 1 day
- **Mainnet Deployment:** After all above complete

---

## CONTACT FOR QUESTIONS

If you need clarification on any of these fixes, refer to the full audit report:
`/home/elmigguel/BillHaven/SMART_CONTRACT_SECURITY_AUDIT_V4_COMPREHENSIVE.md`

---

**Last Updated:** 2025-12-02
**Audit Version:** 1.0
**Status:** ⚠️ CRITICAL FIXES REQUIRED
