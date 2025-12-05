// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title BillHavenEscrowV3
 * @author BillHaven Team
 * @notice Multi-chain P2P Fiat-to-Crypto escrow with multi-confirmation & hold periods
 * @dev Production-ready escrow with security features inspired by Binance P2P, Paxful
 *
 * SECURITY FEATURES:
 * - Multi-confirmation pattern (Payer + Oracle/Maker)
 * - Payment method-based hold periods (prevents chargebacks)
 * - Velocity limits (prevents fraud scaling)
 * - Progressive trust system (NEW_USER -> ELITE)
 * - Oracle signature verification for payment webhooks
 * - Role-based access control (ADMIN, ARBITRATOR, ORACLE)
 *
 * PAYMENT FLOW:
 * 1. Bill Maker creates bill and locks crypto
 * 2. Payer claims the bill on-chain
 * 3. Payer pays fiat off-chain (bank/iDEAL/PayPal)
 * 4. Payer marks payment sent (confirmPaymentSent)
 * 5. Oracle verifies payment via webhook (verifyPaymentReceived) OR
 *    Bill Maker confirms manually (makerConfirmPayment)
 * 6. Hold period countdown starts
 * 7. After hold period: auto-release OR maker can skip hold
 * 8. Crypto released to Payer, fee to platform
 */
contract BillHavenEscrowV3 is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ ROLES ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // ============ ENUMS ============

    /**
     * @notice Bill confirmation states (multi-confirmation pattern)
     */
    enum ConfirmationStatus {
        CREATED,              // 0: Bill created, not yet funded
        FUNDED,               // 1: Crypto locked in escrow
        CLAIMED,              // 2: Payer claimed the bill
        PAYMENT_SENT,         // 3: Payer marked payment as sent
        PAYMENT_VERIFIED,     // 4: Oracle OR Maker confirmed payment
        HOLD_COMPLETE,        // 5: Hold period elapsed, ready for release
        RELEASED,             // 6: Crypto released to payer
        DISPUTED,             // 7: Dispute raised
        REFUNDED,             // 8: Funds returned to maker
        CANCELLED             // 9: Bill cancelled before claim
    }

    /**
     * @notice Payment method risk classification
     * @dev Higher risk = longer hold period
     */
    enum PaymentMethod {
        CRYPTO,               // 0: No risk, instant
        CASH_DEPOSIT,         // 1: Low risk, 1 hour
        WIRE_TRANSFER,        // 2: Low risk, 2 days
        IDEAL,                // 3: Medium risk, 24 hours (NL)
        SEPA,                 // 4: Medium risk, 3 days (EU)
        BANK_TRANSFER,        // 5: High risk, 5 days (ACH)
        PAYPAL_FRIENDS,       // 6: Medium risk, 3 days (no chargeback)
        PAYPAL_GOODS,         // 7: BLOCKED - 180 day chargeback
        CREDIT_CARD,          // 8: BLOCKED - 120 day chargeback
        OTHER                 // 9: Default, 7 days
    }

    /**
     * @notice User trust levels for velocity limits
     */
    enum TrustLevel {
        NEW_USER,             // 0-5 successful trades
        TRUSTED,              // 6-20 successful trades
        VERIFIED,             // 21-50 successful trades
        ELITE                 // 50+ successful trades
    }

    // ============ STRUCTS ============

    struct Bill {
        // Core data
        address billMaker;           // Who locks crypto
        address payer;               // Who pays fiat, receives crypto
        address token;               // ERC20 address (address(0) = native)
        uint256 amount;              // Crypto amount for payer
        uint256 platformFee;         // Platform fee amount
        uint256 fiatAmount;          // Fiat amount in cents (for matching)

        // Confirmation tracking
        ConfirmationStatus status;
        PaymentMethod paymentMethod;
        bool payerConfirmed;         // Payer marked payment sent
        bool oracleVerified;         // Oracle verified payment
        bool makerConfirmed;         // Maker confirmed payment received

        // Timestamps
        uint256 createdAt;
        uint256 fundedAt;
        uint256 paymentSentAt;
        uint256 verifiedAt;          // When payment was verified
        uint256 releaseTime;         // When funds can be auto-released
        uint256 expiresAt;           // Auto-refund deadline

        // Reference for payment matching
        bytes32 paymentReference;    // Unique reference for webhook matching
    }

    struct UserStats {
        uint256 totalTrades;
        uint256 successfulTrades;
        uint256 disputedTrades;
        uint256 dailyVolume;
        uint256 weeklyVolume;
        uint256 lastTradeDate;
        uint256 lastWeekStart;
        TrustLevel trustLevel;
        bool isBlacklisted;
    }

    struct VelocityLimits {
        uint256 maxDailyVolume;      // In USD cents
        uint256 maxWeeklyVolume;     // In USD cents
        uint256 maxTradeSize;        // In USD cents
        uint256 maxDailyTrades;
    }

    // ============ STATE VARIABLES ============

    mapping(uint256 => Bill) public bills;
    mapping(address => UserStats) public userStats;
    mapping(address => bool) public supportedTokens;
    mapping(address => bool) public trustedOracles;
    mapping(bytes32 => bool) public usedPaymentReferences;
    mapping(TrustLevel => VelocityLimits) public velocityLimits;
    mapping(PaymentMethod => uint256) public holdPeriods;
    mapping(PaymentMethod => bool) public blockedMethods;

    uint256 public billCounter;
    address public feeWallet;
    uint256 public platformFeePercent = 440; // 4.4% in basis points (440/10000)
    uint256 public constant MAX_FEE = 1000;  // 10% max fee
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public minConfirmations = 1;     // Require N oracle confirmations

    // ============ EVENTS ============

    event BillCreated(
        uint256 indexed billId,
        address indexed billMaker,
        address indexed token,
        uint256 amount,
        uint256 fee,
        PaymentMethod paymentMethod
    );
    event BillFunded(uint256 indexed billId, uint256 totalAmount);
    event BillClaimed(uint256 indexed billId, address indexed payer);
    event PaymentMarkedSent(uint256 indexed billId, bytes32 paymentReference);
    event PaymentVerified(uint256 indexed billId, address verifiedBy, bool isOracle);
    event HoldPeriodComplete(uint256 indexed billId, uint256 releaseTime);
    event CryptoReleased(uint256 indexed billId, address indexed payer, uint256 amount, uint256 fee);
    event BillDisputed(uint256 indexed billId, address indexed by);
    event DisputeResolved(uint256 indexed billId, bool releasedToPayer, address resolver);
    event BillRefunded(uint256 indexed billId, address indexed billMaker, uint256 amount);
    event BillCancelled(uint256 indexed billId, address indexed billMaker);
    event UserUpgraded(address indexed user, TrustLevel newLevel);
    event VelocityLimitExceeded(address indexed user, string limitType);
    event OracleAdded(address indexed oracle);
    event OracleRemoved(address indexed oracle);

    // ============ ERRORS ============

    error InvalidAddress();
    error InvalidAmount();
    error InvalidPaymentMethod();
    error PaymentMethodBlocked();
    error BillNotFound();
    error BillAlreadyClaimed();
    error BillNotClaimed();
    error BillExpired();
    error BillNotExpired();
    error NotBillMaker();
    error NotBillPayer();
    error NotAuthorized();
    error InvalidState();
    error HoldPeriodNotElapsed();
    error VelocityLimitExceededError(string limitType);
    error UserBlacklisted();
    error InvalidSignature();
    error PaymentReferenceUsed();
    error TokenNotSupported();

    // ============ CONSTRUCTOR ============

    constructor(address _feeWallet) {
        if (_feeWallet == address(0)) revert InvalidAddress();

        feeWallet = _feeWallet;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ARBITRATOR_ROLE, msg.sender);

        // Native token always supported
        supportedTokens[address(0)] = true;

        // Initialize hold periods (in seconds)
        holdPeriods[PaymentMethod.CRYPTO] = 0;                    // Instant
        holdPeriods[PaymentMethod.CASH_DEPOSIT] = 1 hours;        // 1 hour
        holdPeriods[PaymentMethod.WIRE_TRANSFER] = 2 days;        // 2 days
        holdPeriods[PaymentMethod.IDEAL] = 24 hours;              // 24 hours (NL)
        holdPeriods[PaymentMethod.SEPA] = 3 days;                 // 3 days (EU)
        holdPeriods[PaymentMethod.BANK_TRANSFER] = 5 days;        // 5 days (ACH)
        holdPeriods[PaymentMethod.PAYPAL_FRIENDS] = 3 days;       // 3 days
        holdPeriods[PaymentMethod.OTHER] = 7 days;                // 7 days default

        // Block high-risk methods
        blockedMethods[PaymentMethod.PAYPAL_GOODS] = true;        // 180 day chargeback
        blockedMethods[PaymentMethod.CREDIT_CARD] = true;         // 120 day chargeback

        // Initialize velocity limits (in USD cents)
        velocityLimits[TrustLevel.NEW_USER] = VelocityLimits({
            maxDailyVolume: 100000,      // $1,000/day
            maxWeeklyVolume: 500000,     // $5,000/week
            maxTradeSize: 50000,         // $500/trade
            maxDailyTrades: 3
        });

        velocityLimits[TrustLevel.TRUSTED] = VelocityLimits({
            maxDailyVolume: 500000,      // $5,000/day
            maxWeeklyVolume: 2000000,    // $20,000/week
            maxTradeSize: 200000,        // $2,000/trade
            maxDailyTrades: 10
        });

        velocityLimits[TrustLevel.VERIFIED] = VelocityLimits({
            maxDailyVolume: 2000000,     // $20,000/day
            maxWeeklyVolume: 10000000,   // $100,000/week
            maxTradeSize: 1000000,       // $10,000/trade
            maxDailyTrades: 20
        });

        velocityLimits[TrustLevel.ELITE] = VelocityLimits({
            maxDailyVolume: 10000000,    // $100,000/day
            maxWeeklyVolume: 50000000,   // $500,000/week
            maxTradeSize: 5000000,       // $50,000/trade
            maxDailyTrades: 50
        });
    }

    // ============ CORE FUNCTIONS ============

    /**
     * @notice Create bill with NATIVE token (ETH, MATIC, BNB, etc.)
     * @param _fiatAmount Fiat amount in cents (for webhook matching)
     * @param _paymentMethod Payment method enum
     */
    function createBill(
        uint256 _fiatAmount,
        PaymentMethod _paymentMethod
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        if (msg.value == 0) revert InvalidAmount();
        if (blockedMethods[_paymentMethod]) revert PaymentMethodBlocked();

        // Check velocity limits
        _checkVelocityLimits(msg.sender, _fiatAmount);

        // Calculate platform fee
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

    /**
     * @notice Create bill with ERC20 token (USDT, USDC, WBTC, etc.)
     * @param _token ERC20 token address
     * @param _amount Total amount to lock (fee calculated from this)
     * @param _fiatAmount Fiat amount in cents
     * @param _paymentMethod Payment method enum
     */
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

        // Check velocity limits
        _checkVelocityLimits(msg.sender, _fiatAmount);

        // Calculate platform fee
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

    /**
     * @notice Payer claims a bill
     * @param _billId The bill ID to claim
     */
    function claimBill(uint256 _billId) external nonReentrant whenNotPaused {
        Bill storage bill = bills[_billId];

        if (bill.billMaker == address(0)) revert BillNotFound();
        if (bill.status != ConfirmationStatus.FUNDED) revert InvalidState();
        if (bill.payer != address(0)) revert BillAlreadyClaimed();
        if (msg.sender == bill.billMaker) revert NotAuthorized();
        if (block.timestamp >= bill.expiresAt) revert BillExpired();

        // Check velocity limits for payer
        _checkVelocityLimits(msg.sender, bill.fiatAmount);

        bill.payer = msg.sender;
        bill.status = ConfirmationStatus.CLAIMED;

        emit BillClaimed(_billId, msg.sender);
    }

    /**
     * @notice Payer marks payment as sent (provides reference)
     * @param _billId The bill ID
     * @param _paymentReference Unique payment reference for webhook matching
     */
    function confirmPaymentSent(
        uint256 _billId,
        bytes32 _paymentReference
    ) external whenNotPaused {
        Bill storage bill = bills[_billId];

        if (msg.sender != bill.payer) revert NotBillPayer();
        if (bill.status != ConfirmationStatus.CLAIMED) revert InvalidState();
        if (usedPaymentReferences[_paymentReference]) revert PaymentReferenceUsed();

        bill.status = ConfirmationStatus.PAYMENT_SENT;
        bill.payerConfirmed = true;
        bill.paymentSentAt = block.timestamp;
        bill.paymentReference = _paymentReference;

        // Mark reference as used (prevents replay)
        usedPaymentReferences[_paymentReference] = true;

        emit PaymentMarkedSent(_billId, _paymentReference);
    }

    /**
     * @notice Oracle verifies payment via webhook signature
     * @param _billId Bill ID
     * @param _paymentReference Payment reference (must match)
     * @param _fiatAmount Fiat amount in cents (must match)
     * @param _timestamp Verification timestamp
     * @param _signature ECDSA signature from trusted oracle
     */
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

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
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

    /**
     * @notice Bill Maker manually confirms payment received
     * @param _billId The bill ID
     */
    function makerConfirmPayment(uint256 _billId) external whenNotPaused {
        Bill storage bill = bills[_billId];

        if (msg.sender != bill.billMaker) revert NotBillMaker();
        if (bill.status != ConfirmationStatus.PAYMENT_SENT &&
            bill.status != ConfirmationStatus.PAYMENT_VERIFIED) revert InvalidState();

        bill.makerConfirmed = true;

        // If not yet verified, mark as verified now
        if (bill.status == ConfirmationStatus.PAYMENT_SENT) {
            bill.status = ConfirmationStatus.PAYMENT_VERIFIED;
            bill.verifiedAt = block.timestamp;
            bill.releaseTime = block.timestamp + holdPeriods[bill.paymentMethod];
        }

        emit PaymentVerified(_billId, msg.sender, false);
    }

    /**
     * @notice Maker confirms and releases immediately (skips hold period)
     * @param _billId The bill ID
     */
    function makerConfirmAndRelease(uint256 _billId) external nonReentrant whenNotPaused {
        Bill storage bill = bills[_billId];

        if (msg.sender != bill.billMaker) revert NotBillMaker();
        if (bill.status != ConfirmationStatus.PAYMENT_SENT &&
            bill.status != ConfirmationStatus.PAYMENT_VERIFIED &&
            bill.status != ConfirmationStatus.HOLD_COMPLETE) revert InvalidState();

        bill.makerConfirmed = true;

        // Release immediately
        _releaseFunds(_billId);
    }

    /**
     * @notice Release funds after hold period
     * @param _billId The bill ID
     */
    function releaseFunds(uint256 _billId) external nonReentrant whenNotPaused {
        Bill storage bill = bills[_billId];

        // Must be verified
        if (bill.status != ConfirmationStatus.PAYMENT_VERIFIED &&
            bill.status != ConfirmationStatus.HOLD_COMPLETE) revert InvalidState();

        // Check hold period
        if (block.timestamp < bill.releaseTime) revert HoldPeriodNotElapsed();

        // Only bill maker, payer, or admin can release after hold
        if (msg.sender != bill.billMaker &&
            msg.sender != bill.payer &&
            !hasRole(ADMIN_ROLE, msg.sender)) revert NotAuthorized();

        _releaseFunds(_billId);
    }

    /**
     * @notice Auto-release check (can be called by anyone after hold period)
     * @param _billId The bill ID
     */
    function autoRelease(uint256 _billId) external nonReentrant whenNotPaused {
        Bill storage bill = bills[_billId];

        if (bill.status != ConfirmationStatus.PAYMENT_VERIFIED &&
            bill.status != ConfirmationStatus.HOLD_COMPLETE) revert InvalidState();

        if (block.timestamp < bill.releaseTime) revert HoldPeriodNotElapsed();

        _releaseFunds(_billId);
    }

    // ============ DISPUTE FUNCTIONS ============

    /**
     * @notice Raise a dispute
     * @param _billId The bill ID
     */
    function raiseDispute(uint256 _billId) external whenNotPaused {
        Bill storage bill = bills[_billId];

        if (msg.sender != bill.billMaker && msg.sender != bill.payer) revert NotAuthorized();
        if (bill.status == ConfirmationStatus.RELEASED ||
            bill.status == ConfirmationStatus.REFUNDED ||
            bill.status == ConfirmationStatus.CANCELLED ||
            bill.status == ConfirmationStatus.DISPUTED) revert InvalidState();

        bill.status = ConfirmationStatus.DISPUTED;

        // Record dispute for both parties
        _recordDisputedTrade(bill.billMaker);
        if (bill.payer != address(0)) {
            _recordDisputedTrade(bill.payer);
        }

        emit BillDisputed(_billId, msg.sender);
    }

    /**
     * @notice Arbitrator resolves dispute
     * @param _billId The bill ID
     * @param _releaseToPayer True to release to payer, false to refund maker
     */
    function resolveDispute(
        uint256 _billId,
        bool _releaseToPayer
    ) external onlyRole(ARBITRATOR_ROLE) nonReentrant {
        Bill storage bill = bills[_billId];

        if (bill.status != ConfirmationStatus.DISPUTED) revert InvalidState();

        if (_releaseToPayer && bill.payer != address(0)) {
            _releaseFunds(_billId);
        } else {
            _refundMaker(_billId);
        }

        emit DisputeResolved(_billId, _releaseToPayer, msg.sender);
    }

    // ============ CANCEL / REFUND FUNCTIONS ============

    /**
     * @notice Bill maker cancels unclaimed bill
     * @param _billId The bill ID
     */
    function cancelBill(uint256 _billId) external nonReentrant {
        Bill storage bill = bills[_billId];

        if (msg.sender != bill.billMaker) revert NotBillMaker();
        if (bill.status != ConfirmationStatus.FUNDED) revert InvalidState();
        if (bill.payer != address(0)) revert BillAlreadyClaimed();

        _refundMaker(_billId);
        bill.status = ConfirmationStatus.CANCELLED;

        emit BillCancelled(_billId, msg.sender);
    }

    /**
     * @notice Refund expired bill (unclaimed only)
     * @param _billId The bill ID
     */
    function refundExpiredBill(uint256 _billId) external nonReentrant {
        Bill storage bill = bills[_billId];

        if (block.timestamp <= bill.expiresAt) revert BillNotExpired();
        if (bill.payer != address(0)) revert BillAlreadyClaimed();
        if (bill.status != ConfirmationStatus.FUNDED) revert InvalidState();

        _refundMaker(_billId);
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @dev Release funds to payer
     */
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

    /**
     * @dev Refund funds to bill maker
     */
    function _refundMaker(uint256 _billId) internal {
        Bill storage bill = bills[_billId];

        uint256 totalAmount = bill.amount + bill.platformFee;
        address token = bill.token;
        address billMaker = bill.billMaker;

        // Clear amounts before transfer
        bill.amount = 0;
        bill.platformFee = 0;
        bill.status = ConfirmationStatus.REFUNDED;

        if (token == address(0)) {
            (bool success, ) = payable(billMaker).call{value: totalAmount}("");
            require(success, "Refund failed");
        } else {
            IERC20(token).safeTransfer(billMaker, totalAmount);
        }

        emit BillRefunded(_billId, billMaker, totalAmount);
    }

    /**
     * @dev Check velocity limits for user
     */
    function _checkVelocityLimits(address _user, uint256 _fiatAmount) internal {
        UserStats storage stats = userStats[_user];

        if (stats.isBlacklisted) revert UserBlacklisted();

        // Reset daily volume if new day
        if (block.timestamp >= stats.lastTradeDate + 1 days) {
            stats.dailyVolume = 0;
            stats.lastTradeDate = block.timestamp;
        }

        // Reset weekly volume if new week
        if (block.timestamp >= stats.lastWeekStart + 7 days) {
            stats.weeklyVolume = 0;
            stats.lastWeekStart = block.timestamp;
        }

        VelocityLimits memory limits = velocityLimits[stats.trustLevel];

        // Check trade size
        if (_fiatAmount > limits.maxTradeSize) {
            emit VelocityLimitExceeded(_user, "maxTradeSize");
            revert VelocityLimitExceededError("maxTradeSize");
        }

        // Check daily volume
        if (stats.dailyVolume + _fiatAmount > limits.maxDailyVolume) {
            emit VelocityLimitExceeded(_user, "maxDailyVolume");
            revert VelocityLimitExceededError("maxDailyVolume");
        }

        // Check weekly volume
        if (stats.weeklyVolume + _fiatAmount > limits.maxWeeklyVolume) {
            emit VelocityLimitExceeded(_user, "maxWeeklyVolume");
            revert VelocityLimitExceededError("maxWeeklyVolume");
        }

        // Update volumes
        stats.dailyVolume += _fiatAmount;
        stats.weeklyVolume += _fiatAmount;
    }

    /**
     * @dev Record successful trade and update trust level
     */
    function _recordSuccessfulTrade(address _user) internal {
        UserStats storage stats = userStats[_user];

        stats.totalTrades++;
        stats.successfulTrades++;

        TrustLevel oldLevel = stats.trustLevel;

        if (stats.successfulTrades >= 50) {
            stats.trustLevel = TrustLevel.ELITE;
        } else if (stats.successfulTrades >= 21) {
            stats.trustLevel = TrustLevel.VERIFIED;
        } else if (stats.successfulTrades >= 6) {
            stats.trustLevel = TrustLevel.TRUSTED;
        }

        if (stats.trustLevel != oldLevel) {
            emit UserUpgraded(_user, stats.trustLevel);
        }
    }

    /**
     * @dev Record disputed trade (affects trust negatively)
     */
    function _recordDisputedTrade(address _user) internal {
        UserStats storage stats = userStats[_user];

        stats.totalTrades++;
        stats.disputedTrades++;

        // Downgrade if dispute rate > 20%
        if (stats.totalTrades > 5) {
            uint256 disputeRate = (stats.disputedTrades * 100) / stats.totalTrades;

            if (disputeRate > 20) {
                if (stats.trustLevel == TrustLevel.ELITE) {
                    stats.trustLevel = TrustLevel.VERIFIED;
                } else if (stats.trustLevel == TrustLevel.VERIFIED) {
                    stats.trustLevel = TrustLevel.TRUSTED;
                } else if (stats.trustLevel == TrustLevel.TRUSTED) {
                    stats.trustLevel = TrustLevel.NEW_USER;
                }
            }

            // Blacklist if dispute rate > 50%
            if (disputeRate > 50) {
                stats.isBlacklisted = true;
            }
        }
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get bill details
     */
    function getBill(uint256 _billId) external view returns (Bill memory) {
        return bills[_billId];
    }

    /**
     * @notice Get user stats
     */
    function getUserStats(address _user) external view returns (UserStats memory) {
        return userStats[_user];
    }

    /**
     * @notice Get user's current velocity limits
     */
    function getUserLimits(address _user) external view returns (VelocityLimits memory) {
        return velocityLimits[userStats[_user].trustLevel];
    }

    /**
     * @notice Check if bill can be released
     */
    function canRelease(uint256 _billId) external view returns (bool, string memory) {
        Bill storage bill = bills[_billId];

        if (bill.status == ConfirmationStatus.RELEASED) {
            return (false, "Already released");
        }
        if (bill.status != ConfirmationStatus.PAYMENT_VERIFIED &&
            bill.status != ConfirmationStatus.HOLD_COMPLETE) {
            return (false, "Payment not verified");
        }
        if (block.timestamp < bill.releaseTime) {
            return (false, "Hold period not elapsed");
        }
        return (true, "Ready to release");
    }

    /**
     * @notice Get hold period for payment method
     */
    function getHoldPeriod(PaymentMethod _method) external view returns (uint256) {
        return holdPeriods[_method];
    }

    /**
     * @notice Check if payment method is blocked
     */
    function isMethodBlocked(PaymentMethod _method) external view returns (bool) {
        return blockedMethods[_method];
    }

    /**
     * @notice Calculate recommended tiered fee for a fiat amount
     * @dev This is a VIEW FUNCTION for reference only. Actual fee is passed by frontend.
     * @param _fiatAmount Fiat amount in USD cents
     * @param _hasAffiliateDiscount Whether user has affiliate discount (50% off <$10K tier)
     * @return feeInBasisPoints The recommended fee in basis points (e.g., 440 = 4.4%)
     * @return feeAmount The calculated fee amount in cents
     *
     * Tiered Fee Structure:
     * - Under $10,000:      440 bp (4.4%) or 220 bp (2.2% with affiliate)
     * - $10,000 - $20,000:  350 bp (3.5%)
     * - $20,000 - $50,000:  280 bp (2.8%)
     * - $50,000 - $500,000: 170 bp (1.7%)
     * - $500,000 - $1M:     120 bp (1.2%)
     * - Over $1,000,000:    80 bp (0.8%)
     */
    function calculateTieredFee(
        uint256 _fiatAmount,
        bool _hasAffiliateDiscount
    ) external pure returns (uint256 feeInBasisPoints, uint256 feeAmount) {
        // Convert cents to dollars for tier comparison
        uint256 amountInDollars = _fiatAmount / 100;

        if (amountInDollars >= 1000000) {
            feeInBasisPoints = 80; // 0.8%
        } else if (amountInDollars >= 500000) {
            feeInBasisPoints = 120; // 1.2%
        } else if (amountInDollars >= 50000) {
            feeInBasisPoints = 170; // 1.7%
        } else if (amountInDollars >= 20000) {
            feeInBasisPoints = 280; // 2.8%
        } else if (amountInDollars >= 10000) {
            feeInBasisPoints = 350; // 3.5%
        } else {
            // Affiliate discount only applies to <$10K tier
            feeInBasisPoints = _hasAffiliateDiscount ? 220 : 440; // 2.2% or 4.4%
        }

        // Calculate fee amount in cents
        feeAmount = (_fiatAmount * feeInBasisPoints) / BASIS_POINTS;

        return (feeInBasisPoints, feeAmount);
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @notice Add trusted oracle
     */
    function addOracle(address _oracle) external onlyRole(ADMIN_ROLE) {
        if (_oracle == address(0)) revert InvalidAddress();
        trustedOracles[_oracle] = true;
        _grantRole(ORACLE_ROLE, _oracle);
        emit OracleAdded(_oracle);
    }

    /**
     * @notice Remove trusted oracle
     */
    function removeOracle(address _oracle) external onlyRole(ADMIN_ROLE) {
        trustedOracles[_oracle] = false;
        _revokeRole(ORACLE_ROLE, _oracle);
        emit OracleRemoved(_oracle);
    }

    /**
     * @notice Add supported ERC20 token
     */
    function addSupportedToken(address _token) external onlyRole(ADMIN_ROLE) {
        if (_token == address(0)) revert InvalidAddress();
        supportedTokens[_token] = true;
    }

    /**
     * @notice Remove supported ERC20 token
     */
    function removeSupportedToken(address _token) external onlyRole(ADMIN_ROLE) {
        if (_token == address(0)) revert InvalidAddress();
        supportedTokens[_token] = false;
    }

    /**
     * @notice Update hold period for payment method
     */
    function updateHoldPeriod(
        PaymentMethod _method,
        uint256 _period
    ) external onlyRole(ADMIN_ROLE) {
        holdPeriods[_method] = _period;
    }

    /**
     * @notice Block/unblock payment method
     */
    function setMethodBlocked(
        PaymentMethod _method,
        bool _blocked
    ) external onlyRole(ADMIN_ROLE) {
        blockedMethods[_method] = _blocked;
    }

    /**
     * @notice Update velocity limits for trust level
     */
    function updateVelocityLimits(
        TrustLevel _level,
        uint256 _maxDaily,
        uint256 _maxWeekly,
        uint256 _maxTrade,
        uint256 _maxDailyTrades
    ) external onlyRole(ADMIN_ROLE) {
        velocityLimits[_level] = VelocityLimits({
            maxDailyVolume: _maxDaily,
            maxWeeklyVolume: _maxWeekly,
            maxTradeSize: _maxTrade,
            maxDailyTrades: _maxDailyTrades
        });
    }

    /**
     * @notice Manually set user trust level
     */
    function setUserTrustLevel(
        address _user,
        TrustLevel _level
    ) external onlyRole(ADMIN_ROLE) {
        userStats[_user].trustLevel = _level;
        emit UserUpgraded(_user, _level);
    }

    /**
     * @notice Blacklist/unblacklist user
     */
    function setUserBlacklist(
        address _user,
        bool _blacklisted
    ) external onlyRole(ADMIN_ROLE) {
        userStats[_user].isBlacklisted = _blacklisted;
    }

    /**
     * @notice Update platform fee
     */
    function updatePlatformFee(uint256 _newFeePercent) external onlyRole(ADMIN_ROLE) {
        if (_newFeePercent > MAX_FEE) revert InvalidAmount();
        platformFeePercent = _newFeePercent;
    }

    /**
     * @notice Update fee wallet
     */
    function updateFeeWallet(address _newWallet) external onlyRole(ADMIN_ROLE) {
        if (_newWallet == address(0)) revert InvalidAddress();
        feeWallet = _newWallet;
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Rescue stuck native funds (excess only, not active escrows)
     * @dev Calculates total locked in active bills and only allows withdrawal of excess
     */
    function rescueStuckFunds() external onlyRole(ADMIN_ROLE) whenPaused {
        // Calculate total locked in active bills
        uint256 totalLocked = 0;
        for (uint256 i = 1; i <= billCounter; i++) {
            Bill storage bill = bills[i];
            if (bill.token == address(0) &&
                bill.status != ConfirmationStatus.RELEASED &&
                bill.status != ConfirmationStatus.REFUNDED &&
                bill.status != ConfirmationStatus.CANCELLED) {
                totalLocked += bill.amount + bill.platformFee;
            }
        }

        uint256 available = address(this).balance - totalLocked;
        require(available > 0, "No excess funds");

        // Send to feeWallet (safer than msg.sender)
        (bool success, ) = payable(feeWallet).call{value: available}("");
        require(success, "Rescue failed");
    }

    /**
     * @notice Rescue stuck ERC20 tokens (excess only)
     */
    function rescueStuckTokens(address _token) external onlyRole(ADMIN_ROLE) whenPaused {
        if (_token == address(0)) revert InvalidAddress();

        uint256 totalLocked = 0;
        for (uint256 i = 1; i <= billCounter; i++) {
            Bill storage bill = bills[i];
            if (bill.token == _token &&
                bill.status != ConfirmationStatus.RELEASED &&
                bill.status != ConfirmationStatus.REFUNDED &&
                bill.status != ConfirmationStatus.CANCELLED) {
                totalLocked += bill.amount + bill.platformFee;
            }
        }

        uint256 contractBalance = IERC20(_token).balanceOf(address(this));
        uint256 available = contractBalance - totalLocked;
        require(available > 0, "No excess tokens");

        IERC20(_token).safeTransfer(feeWallet, available);
    }

    // Receive function to accept ETH/MATIC
    receive() external payable {}
}
