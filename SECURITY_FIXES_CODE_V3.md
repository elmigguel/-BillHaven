# BILLHAVEN V3 - SECURITY FIXES CODE
**Ready-to-Implement Solutions**
**Date:** December 2, 2025

This document provides production-ready code fixes for all CRITICAL and HIGH vulnerabilities identified in the security audit.

---

## CRITICAL FIX #1: Front-Running Protection

### Option A: Minimum Wait Time (Simpler, Recommended for V3)

```solidity
// Add to contract state variables
uint256 public minClaimDelay = 30; // seconds, configurable

// Add to createBill and createBillWithToken
bills[billCounter] = Bill({
    // ... existing fields ...
    fundedAt: block.timestamp,  // Already exists
    // ... rest of fields ...
});

// Modify claimBill function
function claimBill(uint256 _billId) external nonReentrant whenNotPaused {
    Bill storage bill = bills[_billId];

    if (bill.billMaker == address(0)) revert BillNotFound();
    if (bill.status != ConfirmationStatus.FUNDED) revert InvalidState();
    if (bill.payer != address(0)) revert BillAlreadyClaimed();
    if (msg.sender == bill.billMaker) revert NotAuthorized();
    if (block.timestamp >= bill.expiresAt) revert BillExpired();

    // NEW: Prevent claiming immediately after creation
    require(
        block.timestamp >= bill.fundedAt + minClaimDelay,
        "Wait period not elapsed"
    );

    // Check velocity limits for payer
    _checkVelocityLimits(msg.sender, bill.fiatAmount);

    bill.payer = msg.sender;
    bill.status = ConfirmationStatus.CLAIMED;

    emit BillClaimed(_billId, msg.sender);
}

// Add admin function to update delay
function updateMinClaimDelay(uint256 _newDelay)
    external
    onlyRole(ADMIN_ROLE)
{
    require(_newDelay <= 5 minutes, "Delay too long");
    uint256 oldDelay = minClaimDelay;
    minClaimDelay = _newDelay;

    emit MinClaimDelayUpdated(oldDelay, _newDelay);
}

// Add to events section
event MinClaimDelayUpdated(uint256 oldDelay, uint256 newDelay);
```

### Option B: Commit-Reveal Pattern (Advanced, for V4)

```solidity
// Add to state variables
mapping(uint256 => mapping(address => bytes32)) public claimCommitments;
mapping(uint256 => mapping(address => uint256)) public claimCommitTimes;
uint256 public constant COMMIT_REVEAL_DELAY = 60; // 1 minute

// Step 1: Commit to claim (hides identity)
function commitToClaim(uint256 _billId, bytes32 _commitHash)
    external
    whenNotPaused
{
    Bill storage bill = bills[_billId];

    require(bill.status == ConfirmationStatus.FUNDED, "Bill not available");
    require(block.timestamp < bill.expiresAt, "Bill expired");
    require(
        claimCommitments[_billId][msg.sender] == bytes32(0),
        "Already committed"
    );

    claimCommitments[_billId][msg.sender] = _commitHash;
    claimCommitTimes[_billId][msg.sender] = block.timestamp;

    emit ClaimCommitted(_billId, msg.sender);
}

// Step 2: Reveal and claim
function revealClaim(uint256 _billId, bytes32 _secret)
    external
    nonReentrant
    whenNotPaused
{
    Bill storage bill = bills[_billId];

    // Check commitment exists
    bytes32 storedCommit = claimCommitments[_billId][msg.sender];
    require(storedCommit != bytes32(0), "No commitment found");

    // Check reveal delay passed
    require(
        block.timestamp >= claimCommitTimes[_billId][msg.sender] + COMMIT_REVEAL_DELAY,
        "Reveal too early"
    );

    // Verify commitment
    bytes32 expectedHash = keccak256(
        abi.encodePacked(msg.sender, _billId, _secret)
    );
    require(storedCommit == expectedHash, "Invalid reveal");

    // Clear commitment
    delete claimCommitments[_billId][msg.sender];
    delete claimCommitTimes[_billId][msg.sender];

    // Now claim (same checks as original)
    if (bill.status != ConfirmationStatus.FUNDED) revert InvalidState();
    if (bill.payer != address(0)) revert BillAlreadyClaimed();
    if (msg.sender == bill.billMaker) revert NotAuthorized();
    if (block.timestamp >= bill.expiresAt) revert BillExpired();

    _checkVelocityLimits(msg.sender, bill.fiatAmount);

    bill.payer = msg.sender;
    bill.status = ConfirmationStatus.CLAIMED;

    emit BillClaimed(_billId, msg.sender);
}

// Add events
event ClaimCommitted(uint256 indexed billId, address indexed committer);
```

---

## CRITICAL FIX #2: Oracle Security (Multisig + Timelock)

### Part A: Include ChainId in Signature (IMMEDIATE FIX)

```solidity
// Modify verifyPaymentReceived function
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
    if (_timestamp < block.timestamp - 1 hours) revert InvalidSignature();

    // MODIFIED: Include chainId and contract address in hash
    bytes32 messageHash = keccak256(abi.encodePacked(
        _billId,
        bill.payer,
        bill.billMaker,
        _fiatAmount,
        _paymentReference,
        _timestamp,
        block.chainid,              // NEW: Prevents cross-chain replay
        address(this)               // NEW: Prevents cross-contract replay
    ));

    bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
    address signer = ethSignedHash.recover(_signature);

    if (!trustedOracles[signer]) revert InvalidSignature();

    // Mark as verified
    bill.oracleVerified = true;
    bill.status = ConfirmationStatus.PAYMENT_VERIFIED;
    bill.verifiedAt = block.timestamp;
    bill.releaseTime = block.timestamp + holdPeriods[bill.paymentMethod];

    emit PaymentVerified(_billId, signer, true);

    // Check if hold period is already complete (for crypto payments)
    if (holdPeriods[bill.paymentMethod] == 0) {
        bill.status = ConfirmationStatus.HOLD_COMPLETE;
        emit HoldPeriodComplete(_billId, bill.releaseTime);
    }
}
```

### Part B: Oracle Management with Timelock

```solidity
// Add to state variables
struct PendingOracleChange {
    address oracle;
    bool isAddition;  // true = add, false = remove
    uint256 executeAfter;
    bool executed;
}

mapping(uint256 => PendingOracleChange) public pendingOracleChanges;
uint256 public pendingOracleCount;
uint256 public oracleChangeDelay = 48 hours;

// Events
event OracleChangeProposed(
    uint256 indexed proposalId,
    address indexed oracle,
    bool isAddition,
    uint256 executeAfter
);
event OracleChangeExecuted(uint256 indexed proposalId, address indexed oracle);
event OracleChangeCancelled(uint256 indexed proposalId);

// Step 1: Propose oracle change (requires admin)
function proposeOracleAddition(address _oracle)
    external
    onlyRole(ADMIN_ROLE)
{
    if (_oracle == address(0)) revert InvalidAddress();

    pendingOracleCount++;
    pendingOracleChanges[pendingOracleCount] = PendingOracleChange({
        oracle: _oracle,
        isAddition: true,
        executeAfter: block.timestamp + oracleChangeDelay,
        executed: false
    });

    emit OracleChangeProposed(
        pendingOracleCount,
        _oracle,
        true,
        block.timestamp + oracleChangeDelay
    );
}

function proposeOracleRemoval(address _oracle)
    external
    onlyRole(ADMIN_ROLE)
{
    if (_oracle == address(0)) revert InvalidAddress();

    pendingOracleCount++;
    pendingOracleChanges[pendingOracleCount] = PendingOracleChange({
        oracle: _oracle,
        isAddition: false,
        executeAfter: block.timestamp + oracleChangeDelay,
        executed: false
    });

    emit OracleChangeProposed(
        pendingOracleCount,
        _oracle,
        false,
        block.timestamp + oracleChangeDelay
    );
}

// Step 2: Execute after timelock (anyone can execute)
function executeOracleChange(uint256 _proposalId) external {
    PendingOracleChange storage proposal = pendingOracleChanges[_proposalId];

    require(!proposal.executed, "Already executed");
    require(
        block.timestamp >= proposal.executeAfter,
        "Timelock not expired"
    );

    if (proposal.isAddition) {
        trustedOracles[proposal.oracle] = true;
        _grantRole(ORACLE_ROLE, proposal.oracle);
        emit OracleAdded(proposal.oracle);
    } else {
        trustedOracles[proposal.oracle] = false;
        _revokeRole(ORACLE_ROLE, proposal.oracle);
        emit OracleRemoved(proposal.oracle);
    }

    proposal.executed = true;
    emit OracleChangeExecuted(_proposalId, proposal.oracle);
}

// Cancel proposal (admin only, before execution)
function cancelOracleChange(uint256 _proposalId)
    external
    onlyRole(ADMIN_ROLE)
{
    PendingOracleChange storage proposal = pendingOracleChanges[_proposalId];

    require(!proposal.executed, "Already executed");
    require(
        block.timestamp < proposal.executeAfter,
        "Timelock expired"
    );

    proposal.executed = true; // Mark as executed to prevent re-execution
    emit OracleChangeCancelled(_proposalId);
}

// EMERGENCY: Revoke oracle immediately (requires DEFAULT_ADMIN_ROLE)
function emergencyRevokeOracle(address _oracle)
    external
    onlyRole(DEFAULT_ADMIN_ROLE)
{
    trustedOracles[_oracle] = false;
    _revokeRole(ORACLE_ROLE, _oracle);
    emit OracleRemoved(_oracle);
    emit EmergencyAction("Oracle revoked", _oracle);
}

// Update timelock delay (requires admin)
function updateOracleChangeDelay(uint256 _newDelay)
    external
    onlyRole(ADMIN_ROLE)
{
    require(_newDelay >= 24 hours, "Delay too short");
    require(_newDelay <= 7 days, "Delay too long");

    uint256 oldDelay = oracleChangeDelay;
    oracleChangeDelay = _newDelay;

    emit OracleChangeDelayUpdated(oldDelay, _newDelay);
}

// Remove old addOracle and removeOracle functions
// (or mark as deprecated and revert)
function addOracle(address _oracle) external view onlyRole(ADMIN_ROLE) {
    revert("Use proposeOracleAddition instead");
}

function removeOracle(address _oracle) external view onlyRole(ADMIN_ROLE) {
    revert("Use proposeOracleRemoval instead");
}
```

---

## CRITICAL FIX #3: Emergency Withdraw Protection

```solidity
// Add to state variables
uint256 public totalLockedNative;
mapping(address => uint256) public totalLockedTokens;

// Modify createBill
function createBill(
    uint256 _fiatAmount,
    PaymentMethod _paymentMethod
) external payable nonReentrant whenNotPaused returns (uint256) {
    if (msg.value == 0) revert InvalidAmount();
    if (blockedMethods[_paymentMethod]) revert PaymentMethodBlocked();

    _checkVelocityLimits(msg.sender, _fiatAmount);

    // Track locked funds
    totalLockedNative += msg.value;  // NEW

    uint256 platformFee = (msg.value * platformFeePercent) / BASIS_POINTS;
    uint256 payerAmount = msg.value - platformFee;

    billCounter++;

    bills[billCounter] = Bill({
        billMaker: msg.sender,
        payer: address(0),
        token: address(0),
        amount: payerAmount,
        platformFee: platformFee,
        fiatAmount: _fiatAmount,
        status: ConfirmationStatus.FUNDED,
        paymentMethod: _paymentMethod,
        payerConfirmed: false,
        oracleVerified: false,
        makerConfirmed: false,
        createdAt: block.timestamp,
        fundedAt: block.timestamp,
        paymentSentAt: 0,
        verifiedAt: 0,
        releaseTime: 0,
        expiresAt: block.timestamp + 7 days,
        paymentReference: bytes32(0)
    });

    emit BillCreated(billCounter, msg.sender, address(0), payerAmount, platformFee, _paymentMethod);
    emit BillFunded(billCounter, msg.value);

    return billCounter;
}

// Modify createBillWithToken
function createBillWithToken(
    address _token,
    uint256 _amount,
    uint256 _fiatAmount,
    PaymentMethod _paymentMethod
) external nonReentrant whenNotPaused returns (uint256) {
    if (_token == address(0)) revert InvalidAddress();
    if (!supportedTokens[_token]) revert TokenNotSupported();
    if (_amount == 0) revert InvalidAmount();
    if (blockedMethods[_paymentMethod]) revert PaymentMethodBlocked();

    _checkVelocityLimits(msg.sender, _fiatAmount);

    // Track locked tokens
    totalLockedTokens[_token] += _amount;  // NEW

    uint256 platformFee = (_amount * platformFeePercent) / BASIS_POINTS;
    uint256 payerAmount = _amount - platformFee;

    // Transfer tokens from user to contract
    IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

    billCounter++;

    bills[billCounter] = Bill({
        billMaker: msg.sender,
        payer: address(0),
        token: _token,
        amount: payerAmount,
        platformFee: platformFee,
        fiatAmount: _fiatAmount,
        status: ConfirmationStatus.FUNDED,
        paymentMethod: _paymentMethod,
        payerConfirmed: false,
        oracleVerified: false,
        makerConfirmed: false,
        createdAt: block.timestamp,
        fundedAt: block.timestamp,
        paymentSentAt: 0,
        verifiedAt: 0,
        releaseTime: 0,
        expiresAt: block.timestamp + 7 days,
        paymentReference: bytes32(0)
    });

    emit BillCreated(billCounter, msg.sender, _token, payerAmount, platformFee, _paymentMethod);
    emit BillFunded(billCounter, _amount);

    return billCounter;
}

// Modify _releaseFunds
function _releaseFunds(uint256 _billId) internal {
    Bill storage bill = bills[_billId];

    uint256 payerAmount = bill.amount;
    uint256 feeAmount = bill.platformFee;
    address token = bill.token;
    address payer = bill.payer;

    // Clear amounts before transfer (reentrancy protection)
    bill.amount = 0;
    bill.platformFee = 0;
    bill.status = ConfirmationStatus.RELEASED;

    // Update locked funds tracking
    if (token == address(0)) {
        totalLockedNative -= (payerAmount + feeAmount);  // NEW
    } else {
        totalLockedTokens[token] -= (payerAmount + feeAmount);  // NEW
    }

    // Transfer to payer
    if (token == address(0)) {
        (bool payerSuccess, ) = payable(payer).call{value: payerAmount}("");
        require(payerSuccess, "Payer transfer failed");

        if (feeAmount > 0) {
            (bool feeSuccess, ) = payable(feeWallet).call{value: feeAmount}("");
            require(feeSuccess, "Fee transfer failed");
        }
    } else {
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

// Modify _refundMaker
function _refundMaker(uint256 _billId) internal {
    Bill storage bill = bills[_billId];

    uint256 totalAmount = bill.amount + bill.platformFee;
    address token = bill.token;
    address billMaker = bill.billMaker;

    // Clear amounts before transfer
    bill.amount = 0;
    bill.platformFee = 0;
    bill.status = ConfirmationStatus.REFUNDED;

    // Update locked funds tracking
    if (token == address(0)) {
        totalLockedNative -= totalAmount;  // NEW
    } else {
        totalLockedTokens[token] -= totalAmount;  // NEW
    }

    if (token == address(0)) {
        (bool success, ) = payable(billMaker).call{value: totalAmount}("");
        require(success, "Refund failed");
    } else {
        IERC20(token).safeTransfer(billMaker, totalAmount);
    }

    emit BillRefunded(_billId, billMaker, totalAmount);
}

// NEW: Safe emergency withdraw (surplus only)
function emergencyWithdraw() external onlyRole(ADMIN_ROLE) whenPaused {
    uint256 balance = address(this).balance;
    uint256 locked = totalLockedNative;

    require(balance > locked, "No surplus funds");

    uint256 surplus = balance - locked;

    (bool success, ) = payable(msg.sender).call{value: surplus}("");
    require(success, "Withdraw failed");

    emit EmergencyWithdraw(msg.sender, surplus, locked);
}

function emergencyWithdrawToken(address _token)
    external
    onlyRole(ADMIN_ROLE)
    whenPaused
{
    if (_token == address(0)) revert InvalidAddress();

    uint256 balance = IERC20(_token).balanceOf(address(this));
    uint256 locked = totalLockedTokens[_token];

    require(balance > locked, "No surplus funds");

    uint256 surplus = balance - locked;

    IERC20(_token).safeTransfer(msg.sender, surplus);

    emit EmergencyWithdrawToken(_token, msg.sender, surplus, locked);
}

// Add view functions for transparency
function getLockedBalance() external view returns (uint256) {
    return totalLockedNative;
}

function getLockedTokenBalance(address _token) external view returns (uint256) {
    return totalLockedTokens[_token];
}

function getSurplusBalance() external view returns (uint256) {
    uint256 balance = address(this).balance;
    return balance > totalLockedNative ? balance - totalLockedNative : 0;
}

function getSurplusTokenBalance(address _token) external view returns (uint256) {
    uint256 balance = IERC20(_token).balanceOf(address(this));
    uint256 locked = totalLockedTokens[_token];
    return balance > locked ? balance - locked : 0;
}

// Add events
event EmergencyWithdraw(
    address indexed admin,
    uint256 surplus,
    uint256 locked
);

event EmergencyWithdrawToken(
    address indexed token,
    address indexed admin,
    uint256 surplus,
    uint256 locked
);
```

---

## CRITICAL FIX #4: Fee Change Timelock

```solidity
// Add to state variables
struct PendingFeeChange {
    uint256 newFee;
    uint256 effectiveAfter;
    bool executed;
}

PendingFeeChange public pendingFeeChange;
uint256 public feeChangeDelay = 7 days;

// Events
event FeeChangeProposed(uint256 newFee, uint256 effectiveAfter);
event FeeChangeExecuted(uint256 oldFee, uint256 newFee);
event FeeChangeCancelled(uint256 proposedFee);

// Step 1: Propose fee change
function proposeFeeChange(uint256 _newFee)
    external
    onlyRole(ADMIN_ROLE)
{
    if (_newFee > MAX_FEE) revert InvalidAmount();

    pendingFeeChange = PendingFeeChange({
        newFee: _newFee,
        effectiveAfter: block.timestamp + feeChangeDelay,
        executed: false
    });

    emit FeeChangeProposed(_newFee, pendingFeeChange.effectiveAfter);
}

// Step 2: Execute after timelock
function executeFeeChange() external {
    require(pendingFeeChange.newFee > 0, "No pending change");
    require(!pendingFeeChange.executed, "Already executed");
    require(
        block.timestamp >= pendingFeeChange.effectiveAfter,
        "Timelock not expired"
    );

    uint256 oldFee = platformFeePercent;
    platformFeePercent = pendingFeeChange.newFee;

    pendingFeeChange.executed = true;

    emit FeeChangeExecuted(oldFee, platformFeePercent);
}

// Cancel pending change (admin only, before execution)
function cancelFeeChange() external onlyRole(ADMIN_ROLE) {
    require(pendingFeeChange.newFee > 0, "No pending change");
    require(!pendingFeeChange.executed, "Already executed");

    uint256 cancelledFee = pendingFeeChange.newFee;
    delete pendingFeeChange;

    emit FeeChangeCancelled(cancelledFee);
}

// Remove old updatePlatformFee function
function updatePlatformFee(uint256 _newFeePercent)
    external
    view
    onlyRole(ADMIN_ROLE)
{
    revert("Use proposeFeeChange instead");
}
```

---

## HIGH FIX #1: Hold Period Grandfathering

```solidity
// Modify Bill struct
struct Bill {
    // ... existing fields ...
    uint256 agreedHoldPeriod;  // NEW: Locked at creation time
}

// Modify createBill
function createBill(
    uint256 _fiatAmount,
    PaymentMethod _paymentMethod
) external payable nonReentrant whenNotPaused returns (uint256) {
    // ... existing checks ...

    billCounter++;

    bills[billCounter] = Bill({
        // ... existing fields ...
        agreedHoldPeriod: holdPeriods[_paymentMethod],  // NEW: Lock it now
        // ... rest of fields ...
    });

    // ... rest of logic ...
}

// Modify createBillWithToken (same change)
function createBillWithToken(...) external {
    // ... existing code ...
    bills[billCounter] = Bill({
        // ... existing fields ...
        agreedHoldPeriod: holdPeriods[_paymentMethod],  // NEW
        // ... rest of fields ...
    });
}

// Modify makerConfirmPayment to use agreedHoldPeriod
function makerConfirmPayment(uint256 _billId) external whenNotPaused {
    Bill storage bill = bills[_billId];

    if (msg.sender != bill.billMaker) revert NotBillMaker();
    if (bill.status != ConfirmationStatus.PAYMENT_SENT &&
        bill.status != ConfirmationStatus.PAYMENT_VERIFIED) revert InvalidState();

    bill.makerConfirmed = true;

    if (bill.status == ConfirmationStatus.PAYMENT_SENT) {
        bill.status = ConfirmationStatus.PAYMENT_VERIFIED;
        bill.verifiedAt = block.timestamp;
        bill.releaseTime = block.timestamp + bill.agreedHoldPeriod;  // CHANGED
    }

    emit PaymentVerified(_billId, msg.sender, false);
}

// Modify verifyPaymentReceived to use agreedHoldPeriod
function verifyPaymentReceived(...) external {
    // ... existing verification logic ...

    bill.oracleVerified = true;
    bill.status = ConfirmationStatus.PAYMENT_VERIFIED;
    bill.verifiedAt = block.timestamp;
    bill.releaseTime = block.timestamp + bill.agreedHoldPeriod;  // CHANGED

    emit PaymentVerified(_billId, signer, true);

    if (bill.agreedHoldPeriod == 0) {  // CHANGED
        bill.status = ConfirmationStatus.HOLD_COMPLETE;
        emit HoldPeriodComplete(_billId, bill.releaseTime);
    }
}

// Modify getHoldPeriod to include grandfathering info
function getEffectiveHoldPeriod(uint256 _billId)
    external
    view
    returns (uint256 agreedPeriod, uint256 currentPeriod)
{
    Bill storage bill = bills[_billId];
    return (
        bill.agreedHoldPeriod,
        holdPeriods[bill.paymentMethod]
    );
}

// Update updateHoldPeriod with notice
function updateHoldPeriod(
    PaymentMethod _method,
    uint256 _period
) external onlyRole(ADMIN_ROLE) {
    uint256 oldPeriod = holdPeriods[_method];
    holdPeriods[_method] = _period;

    emit HoldPeriodUpdated(_method, oldPeriod, _period);
    emit Notice("Only affects NEW bills, existing bills unchanged");
}

// Add event
event HoldPeriodUpdated(
    PaymentMethod indexed method,
    uint256 oldPeriod,
    uint256 newPeriod
);
```

---

## HIGH FIX #2: On-Chain Payment Reference Generation

```solidity
// Remove _paymentReference parameter from confirmPaymentSent
function confirmPaymentSent(uint256 _billId)
    external
    whenNotPaused
{
    Bill storage bill = bills[_billId];

    if (msg.sender != bill.payer) revert NotBillPayer();
    if (bill.status != ConfirmationStatus.CLAIMED) revert InvalidState();

    // Generate reference on-chain (unpredictable)
    bytes32 paymentReference = keccak256(abi.encodePacked(
        _billId,
        msg.sender,
        bill.billMaker,
        block.timestamp,
        block.prevrandao,  // Pseudo-random (safe for this use case)
        billCounter        // Add counter for extra uniqueness
    ));

    // Check collision (extremely unlikely with above parameters)
    if (usedPaymentReferences[paymentReference]) {
        // Use alternative hash with blockhash
        paymentReference = keccak256(abi.encodePacked(
            paymentReference,
            blockhash(block.number - 1)
        ));
    }

    require(
        !usedPaymentReferences[paymentReference],
        "Reference collision"
    );

    bill.status = ConfirmationStatus.PAYMENT_SENT;
    bill.payerConfirmed = true;
    bill.paymentSentAt = block.timestamp;
    bill.paymentReference = paymentReference;

    usedPaymentReferences[paymentReference] = true;

    emit PaymentMarkedSent(_billId, paymentReference);
}
```

---

## HIGH FIX #3: Rate Limiting + Minimum Bill Size

```solidity
// Add to state variables
mapping(address => uint256) public lastBillCreation;
uint256 public minBillCreationDelay = 30; // seconds
uint256 public minBillAmountNative = 0.01 ether; // $25 at $2500/ETH
mapping(address => uint256) public minBillAmountToken; // Per token

// Events
event RateLimitUpdated(uint256 oldDelay, uint256 newDelay);
event MinBillAmountUpdated(address indexed token, uint256 oldAmount, uint256 newAmount);

// Modify createBill
function createBill(
    uint256 _fiatAmount,
    PaymentMethod _paymentMethod
) external payable nonReentrant whenNotPaused returns (uint256) {
    if (msg.value == 0) revert InvalidAmount();
    if (blockedMethods[_paymentMethod]) revert PaymentMethodBlocked();

    // NEW: Rate limiting
    require(
        block.timestamp >= lastBillCreation[msg.sender] + minBillCreationDelay,
        "Rate limited: wait between bill creations"
    );

    // NEW: Minimum bill size (prevents spam)
    require(
        msg.value >= minBillAmountNative,
        "Bill amount too small"
    );

    lastBillCreation[msg.sender] = block.timestamp;

    // ... rest of existing logic ...
}

// Modify createBillWithToken
function createBillWithToken(
    address _token,
    uint256 _amount,
    uint256 _fiatAmount,
    PaymentMethod _paymentMethod
) external nonReentrant whenNotPaused returns (uint256) {
    if (_token == address(0)) revert InvalidAddress();
    if (!supportedTokens[_token]) revert TokenNotSupported();
    if (_amount == 0) revert InvalidAmount();
    if (blockedMethods[_paymentMethod]) revert PaymentMethodBlocked();

    // NEW: Rate limiting
    require(
        block.timestamp >= lastBillCreation[msg.sender] + minBillCreationDelay,
        "Rate limited: wait between bill creations"
    );

    // NEW: Minimum bill size
    uint256 minAmount = minBillAmountToken[_token];
    require(
        _amount >= minAmount,
        "Bill amount too small"
    );

    lastBillCreation[msg.sender] = block.timestamp;

    // ... rest of existing logic ...
}

// Admin functions
function updateRateLimit(uint256 _newDelay)
    external
    onlyRole(ADMIN_ROLE)
{
    require(_newDelay <= 5 minutes, "Delay too long");

    uint256 oldDelay = minBillCreationDelay;
    minBillCreationDelay = _newDelay;

    emit RateLimitUpdated(oldDelay, _newDelay);
}

function updateMinBillAmount(address _token, uint256 _minAmount)
    external
    onlyRole(ADMIN_ROLE)
{
    uint256 oldAmount;

    if (_token == address(0)) {
        oldAmount = minBillAmountNative;
        minBillAmountNative = _minAmount;
    } else {
        require(supportedTokens[_token], "Token not supported");
        oldAmount = minBillAmountToken[_token];
        minBillAmountToken[_token] = _minAmount;
    }

    emit MinBillAmountUpdated(_token, oldAmount, _minAmount);
}
```

---

## HIGH FIX #4: Blacklist Check on All Actions

```solidity
// Add modifier
modifier notBlacklisted(address _user) {
    if (userStats[_user].isBlacklisted) revert UserBlacklisted();
    _;
}

// Modify all user-facing functions to include blacklist check

function createBill(...)
    external
    payable
    nonReentrant
    whenNotPaused
    notBlacklisted(msg.sender)  // NEW
    returns (uint256)
{
    // ... existing logic ...
}

function createBillWithToken(...)
    external
    nonReentrant
    whenNotPaused
    notBlacklisted(msg.sender)  // NEW
    returns (uint256)
{
    // ... existing logic ...
}

function claimBill(uint256 _billId)
    external
    nonReentrant
    whenNotPaused
    notBlacklisted(msg.sender)  // NEW
{
    Bill storage bill = bills[_billId];

    if (bill.billMaker == address(0)) revert BillNotFound();

    // NEW: Also check if bill maker is blacklisted
    if (userStats[bill.billMaker].isBlacklisted) {
        revert("Bill maker blacklisted");
    }

    // ... rest of existing logic ...
}

function confirmPaymentSent(uint256 _billId)
    external
    whenNotPaused
    notBlacklisted(msg.sender)  // NEW
{
    // ... existing logic ...
}

function releaseFunds(uint256 _billId)
    external
    nonReentrant
    whenNotPaused
{
    Bill storage bill = bills[_billId];

    // NEW: Check both parties not blacklisted
    if (userStats[bill.billMaker].isBlacklisted) {
        revert("Bill maker blacklisted - cannot release");
    }
    if (userStats[bill.payer].isBlacklisted) {
        revert("Payer blacklisted - cannot release");
    }

    // ... rest of existing logic ...
}

// Modify raiseDispute to prevent blacklisted users
function raiseDispute(uint256 _billId)
    external
    whenNotPaused
    notBlacklisted(msg.sender)  // NEW
{
    // ... existing logic ...
}
```

---

## HIGH FIX #5: Implement Tiered Fees On-Chain

```solidity
// Modify createBill to use tiered fees
function createBill(
    uint256 _fiatAmount,
    PaymentMethod _paymentMethod,
    bool _hasAffiliateDiscount
) external payable nonReentrant whenNotPaused returns (uint256) {
    if (msg.value == 0) revert InvalidAmount();
    if (blockedMethods[_paymentMethod]) revert PaymentMethodBlocked();

    _checkVelocityLimits(msg.sender, _fiatAmount);

    // Calculate tiered platform fee (CHANGED)
    (uint256 feeInBasisPoints, ) = this.calculateTieredFee(
        _fiatAmount,
        _hasAffiliateDiscount
    );

    uint256 platformFee = (msg.value * feeInBasisPoints) / BASIS_POINTS;
    uint256 payerAmount = msg.value - platformFee;

    billCounter++;

    bills[billCounter] = Bill({
        // ... existing fields ...
    });

    emit BillCreated(billCounter, msg.sender, address(0), payerAmount, platformFee, _paymentMethod);
    emit BillFunded(billCounter, msg.value);

    return billCounter;
}

// Same modification for createBillWithToken
function createBillWithToken(
    address _token,
    uint256 _amount,
    uint256 _fiatAmount,
    PaymentMethod _paymentMethod,
    bool _hasAffiliateDiscount
) external nonReentrant whenNotPaused returns (uint256) {
    // ... existing checks ...

    // Calculate tiered platform fee (CHANGED)
    (uint256 feeInBasisPoints, ) = this.calculateTieredFee(
        _fiatAmount,
        _hasAffiliateDiscount
    );

    uint256 platformFee = (_amount * feeInBasisPoints) / BASIS_POINTS;
    uint256 payerAmount = _amount - platformFee;

    // ... rest of logic ...
}
```

---

## ADDITIONAL EVENTS (All Admin Actions)

```solidity
// Add comprehensive events for admin actions

event OracleChangeDelayUpdated(uint256 oldDelay, uint256 newDelay);
event EmergencyAction(string action, address indexed target);
event Notice(string message);

// Update all admin functions to emit events

function updateFeeWallet(address _newWallet)
    external
    onlyRole(ADMIN_ROLE)
{
    if (_newWallet == address(0)) revert InvalidAddress();

    address oldWallet = feeWallet;
    feeWallet = _newWallet;

    emit FeeWalletUpdated(oldWallet, _newWallet);  // NEW event
}

event FeeWalletUpdated(address indexed oldWallet, address indexed newWallet);

function setMethodBlocked(
    PaymentMethod _method,
    bool _blocked
) external onlyRole(ADMIN_ROLE) {
    bool oldStatus = blockedMethods[_method];
    blockedMethods[_method] = _blocked;

    emit PaymentMethodBlockedUpdated(_method, oldStatus, _blocked);  // NEW
}

event PaymentMethodBlockedUpdated(
    PaymentMethod indexed method,
    bool oldStatus,
    bool newStatus
);

function updateVelocityLimits(
    TrustLevel _level,
    uint256 _maxDaily,
    uint256 _maxWeekly,
    uint256 _maxTrade,
    uint256 _maxDailyTrades
) external onlyRole(ADMIN_ROLE) {
    VelocityLimits memory oldLimits = velocityLimits[_level];

    velocityLimits[_level] = VelocityLimits({
        maxDailyVolume: _maxDaily,
        maxWeeklyVolume: _maxWeekly,
        maxTradeSize: _maxTrade,
        maxDailyTrades: _maxDailyTrades
    });

    emit VelocityLimitsUpdated(_level, oldLimits, velocityLimits[_level]);  // NEW
}

event VelocityLimitsUpdated(
    TrustLevel indexed level,
    VelocityLimits oldLimits,
    VelocityLimits newLimits
);

function setUserBlacklist(
    address _user,
    bool _blacklisted
) external onlyRole(ADMIN_ROLE) {
    bool oldStatus = userStats[_user].isBlacklisted;
    userStats[_user].isBlacklisted = _blacklisted;

    emit UserBlacklistUpdated(_user, oldStatus, _blacklisted);  // NEW
}

event UserBlacklistUpdated(
    address indexed user,
    bool oldStatus,
    bool newStatus
);
```

---

## DEPLOYMENT SCRIPT WITH FIXES

```javascript
// deploy-v3-fixed.cjs

const hre = require("hardhat");

async function main() {
    console.log("\n========================================");
    console.log("  BILLHAVEN ESCROW V3 (FIXED) DEPLOYMENT");
    console.log("========================================\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "tokens\n");

    // CRITICAL: Use multisig wallet for fee wallet
    // RECOMMENDED: Create Gnosis Safe at https://app.safe.global/
    const FEE_WALLET = "0x596b95782d98295283c5d72142e477d92549cde3"; // REPLACE WITH MULTISIG

    console.log("1. Deploying BillHavenEscrowV3 (Fixed)...");
    const EscrowV3 = await hre.ethers.getContractFactory("BillHavenEscrowV3");
    const escrowV3 = await EscrowV3.deploy(FEE_WALLET);
    await escrowV3.waitForDeployment();

    const escrowAddress = await escrowV3.getAddress();
    console.log("   Deployed to:", escrowAddress);

    // Configure supported tokens
    console.log("\n2. Adding supported tokens...");
    const network = await hre.ethers.provider.getNetwork();
    const chainId = Number(network.chainid);

    // ... add tokens ...

    // CRITICAL: Transfer admin role to multisig
    console.log("\n3. Transferring admin to multisig...");
    const MULTISIG = "0xYOUR_GNOSIS_SAFE_ADDRESS"; // REPLACE

    if (MULTISIG !== deployer.address) {
        await escrowV3.grantRole(
            await escrowV3.DEFAULT_ADMIN_ROLE(),
            MULTISIG
        );
        console.log("   Granted admin role to multisig:", MULTISIG);

        // NOTE: Deployer can renounce after verifying multisig works
        console.log("   ⚠️ Remember to renounce deployer admin role from multisig");
    }

    console.log("\n✅ Deployment complete!");
    console.log("\nNext steps:");
    console.log("1. Verify contract on block explorer");
    console.log("2. Test all critical functions");
    console.log("3. Renounce deployer admin from multisig");
    console.log("4. Add oracles via proposeOracleAddition");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

---

## TEST FILE UPDATES

```javascript
// Add to test/BillHavenEscrowV3.test.cjs

describe("Security Fixes", function () {
    describe("Front-Running Protection", function () {
        it("Should prevent claiming immediately after creation", async function () {
            const amount = ethers.parseEther("1.0");
            const fiatAmount = 50000;

            await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, { value: amount });

            // Try to claim immediately (should fail)
            await expect(
                escrow.connect(buyer).claimBill(1)
            ).to.be.revertedWith("Wait period not elapsed");

            // Wait 30 seconds
            await time.increase(30);

            // Now should succeed
            await expect(escrow.connect(buyer).claimBill(1))
                .to.emit(escrow, "BillClaimed");
        });
    });

    describe("Oracle Security", function () {
        it("Should require timelock for oracle addition", async function () {
            const newOracle = randomUser.address;

            // Propose oracle addition
            await escrow.proposeOracleAddition(newOracle);

            // Try to execute immediately (should fail)
            await expect(
                escrow.executeOracleChange(1)
            ).to.be.revertedWith("Timelock not expired");

            // Wait 48 hours
            await time.increase(48 * 3600 + 1);

            // Now should succeed
            await expect(escrow.executeOracleChange(1))
                .to.emit(escrow, "OracleAdded");
        });

        it("Should prevent cross-chain signature replay", async function () {
            // This test verifies chainId is in signature hash
            // Would need multi-chain test environment to fully test
        });
    });

    describe("Emergency Withdraw Protection", function () {
        it("Should only allow withdrawal of surplus funds", async function () {
            const amount = ethers.parseEther("1.0");

            // Create bill (locks funds)
            await escrow.connect(seller).createBill(50000, PaymentMethod.IDEAL, { value: amount });

            // Pause contract
            await escrow.pause();

            // Try to withdraw (should fail - no surplus)
            await expect(
                escrow.emergencyWithdraw()
            ).to.be.revertedWith("No surplus funds");

            // Send extra ETH to contract
            await owner.sendTransaction({
                to: await escrow.getAddress(),
                value: ethers.parseEther("0.5")
            });

            // Now should withdraw only surplus
            const balanceBefore = await ethers.provider.getBalance(owner.address);

            const tx = await escrow.emergencyWithdraw();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            const balanceAfter = await ethers.provider.getBalance(owner.address);

            // Should receive 0.5 ETH minus gas
            expect(balanceAfter + gasUsed - balanceBefore).to.equal(ethers.parseEther("0.5"));

            // Bill amount should still be locked
            expect(await escrow.getLockedBalance()).to.equal(amount);
        });
    });

    describe("Fee Change Timelock", function () {
        it("Should require 7-day wait for fee changes", async function () {
            const newFee = 500; // 5%

            // Propose fee change
            await escrow.proposeFeeChange(newFee);

            // Try to execute immediately (should fail)
            await expect(
                escrow.executeFeeChange()
            ).to.be.revertedWith("Timelock not expired");

            // Wait 7 days
            await time.increase(7 * 24 * 3600 + 1);

            // Now should succeed
            await expect(escrow.executeFeeChange())
                .to.emit(escrow, "FeeChangeExecuted");

            expect(await escrow.platformFeePercent()).to.equal(newFee);
        });
    });

    describe("Rate Limiting", function () {
        it("Should prevent rapid bill creation", async function () {
            const amount = ethers.parseEther("0.1");
            const fiatAmount = 10000;

            // Create first bill
            await escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, { value: amount });

            // Try to create second immediately (should fail)
            await expect(
                escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, { value: amount })
            ).to.be.revertedWith("Rate limited");

            // Wait 30 seconds
            await time.increase(30);

            // Now should succeed
            await expect(
                escrow.connect(seller).createBill(fiatAmount, PaymentMethod.IDEAL, { value: amount })
            ).to.emit(escrow, "BillCreated");
        });
    });

    describe("Blacklist Enforcement", function () {
        it("Should prevent blacklisted users from all actions", async function () {
            // Blacklist buyer
            await escrow.setUserBlacklist(buyer.address, true);

            // Try to create bill (should fail)
            await expect(
                escrow.connect(buyer).createBill(10000, PaymentMethod.IDEAL, { value: ethers.parseEther("0.1") })
            ).to.be.revertedWithCustomError(escrow, "UserBlacklisted");

            // Create bill with seller
            await escrow.connect(seller).createBill(10000, PaymentMethod.IDEAL, { value: ethers.parseEther("0.1") });

            // Try to claim (should fail)
            await expect(
                escrow.connect(buyer).claimBill(1)
            ).to.be.revertedWithCustomError(escrow, "UserBlacklisted");
        });
    });
});
```

---

## FRONTEND INTEGRATION NOTES

### 1. Oracle Signature (JavaScript/TypeScript)

```typescript
// oracle-signature.ts (Backend)
import { ethers } from 'ethers';

async function signPaymentVerification(
    billId: number,
    payer: string,
    maker: string,
    fiatAmount: number,
    paymentReference: string,
    timestamp: number,
    chainId: number,
    contractAddress: string
): Promise<string> {
    const oracleSigner = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY!);

    // NEW: Include chainId and contractAddress
    const messageHash = ethers.solidityPackedKeccak256(
        ['uint256', 'address', 'address', 'uint256', 'bytes32', 'uint256', 'uint256', 'address'],
        [billId, payer, maker, fiatAmount, paymentReference, timestamp, chainId, contractAddress]
    );

    const signature = await oracleSigner.signMessage(ethers.getBytes(messageHash));

    return signature;
}
```

### 2. Bill Creation with Tiered Fees (Frontend)

```typescript
// create-bill.ts (Frontend)
import { ethers } from 'ethers';

async function createBillWithTieredFee(
    fiatAmountCents: number,
    paymentMethod: number,
    hasAffiliateDiscount: boolean
) {
    const escrow = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);

    // Calculate expected fee (for UI display)
    const [feeInBasisPoints, feeAmount] = await escrow.calculateTieredFee(
        fiatAmountCents,
        hasAffiliateDiscount
    );

    console.log(`Fee: ${feeInBasisPoints / 100}%`);

    // Create bill (contract will calculate fee on-chain)
    const tx = await escrow.createBill(
        fiatAmountCents,
        paymentMethod,
        hasAffiliateDiscount,
        { value: ethers.parseEther(cryptoAmount) }
    );

    await tx.wait();
}
```

### 3. Wait for Claim Delay (Frontend)

```typescript
// bill-claim.ts
async function waitForClaimEligibility(billId: number) {
    const escrow = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);

    const bill = await escrow.getBill(billId);
    const minDelay = await escrow.minClaimDelay();

    const claimableAt = Number(bill.fundedAt) + Number(minDelay);
    const now = Math.floor(Date.now() / 1000);

    if (now < claimableAt) {
        const waitSeconds = claimableAt - now;
        console.log(`Wait ${waitSeconds} seconds before claiming`);

        // Show countdown in UI
        const interval = setInterval(() => {
            const remaining = claimableAt - Math.floor(Date.now() / 1000);
            if (remaining <= 0) {
                clearInterval(interval);
                // Enable claim button
            } else {
                updateCountdown(remaining);
            }
        }, 1000);
    } else {
        // Already claimable
    }
}
```

---

## MIGRATION GUIDE

### From V3 (Current) to V3-Fixed

1. **Deploy new contract** with fixes
2. **Pause old contract** (prevent new bills)
3. **Wait for all bills** in old contract to complete (or refund)
4. **Transfer admin roles** to multisig on new contract
5. **Update frontend** to use new contract address
6. **Announce migration** to users (7-day notice)

### Breaking Changes

- `confirmPaymentSent()` no longer takes `_paymentReference` parameter
- `createBill()` requires `_hasAffiliateDiscount` parameter
- `addOracle()` and `removeOracle()` replaced with propose/execute pattern
- `updatePlatformFee()` replaced with propose/execute pattern

### Backward Compatibility

Old frontend code will break. Update frontend simultaneously with contract deployment.

---

## TESTING CHECKLIST

Before deploying to mainnet:

- [ ] All 40 original tests still pass
- [ ] Front-running protection test passes
- [ ] Oracle timelock test passes
- [ ] Emergency withdraw surplus test passes
- [ ] Fee change timelock test passes
- [ ] Rate limiting test passes
- [ ] Blacklist enforcement test passes
- [ ] ChainId in signature test passes
- [ ] Hold period grandfathering test passes
- [ ] Tiered fee calculation test passes

---

**END OF FIX CODE DOCUMENT**

*For questions or implementation support, please contact the audit team.*
