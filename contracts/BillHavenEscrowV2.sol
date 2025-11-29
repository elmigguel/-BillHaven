// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BillHavenEscrowV2
 * @dev Multi-chain P2P Fiat-to-Crypto escrow contract with ERC20 support
 *
 * Supports:
 * - Native tokens (ETH, MATIC, BNB, etc.)
 * - ERC20 tokens (USDT, USDC, etc.)
 *
 * Flow:
 * 1. Bill Maker creates bill and locks crypto (amount + fee)
 * 2. Payer claims the bill
 * 3. Payer pays fiat off-chain and uploads proof
 * 4. Bill Maker confirms fiat received -> crypto released to Payer
 * 5. Platform fee goes to feeWallet
 */
contract BillHavenEscrowV2 is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    struct Bill {
        address billMaker;       // Who locks crypto
        address payer;           // Who pays fiat, receives crypto
        address token;           // Token address (address(0) = native token)
        uint256 amount;          // Locked amount for payer
        uint256 platformFee;     // Platform fee
        bool fiatConfirmed;      // Bill maker confirmed fiat received
        bool disputed;           // Dispute active
        uint256 createdAt;
        uint256 expiresAt;       // Auto-refund after expiry
    }

    mapping(uint256 => Bill) public bills;
    mapping(address => bool) public supportedTokens;
    uint256 public billCounter;
    address public feeWallet;

    // Events
    event BillCreated(uint256 indexed billId, address indexed billMaker, address indexed token, uint256 amount, uint256 fee);
    event BillClaimed(uint256 indexed billId, address indexed payer);
    event FiatConfirmed(uint256 indexed billId);
    event CryptoReleased(uint256 indexed billId, address indexed payer, address indexed token, uint256 amount);
    event Disputed(uint256 indexed billId, address indexed by);
    event DisputeResolved(uint256 indexed billId, bool releasedToPayer);
    event Refunded(uint256 indexed billId, address indexed billMaker);
    event FeeWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);

    constructor(address _feeWallet) Ownable(msg.sender) {
        require(_feeWallet != address(0), "Invalid fee wallet");
        feeWallet = _feeWallet;
        // Native token always supported (address(0))
        supportedTokens[address(0)] = true;
    }

    /**
     * @dev Add supported ERC20 token (admin only)
     */
    function addSupportedToken(address _token) external onlyOwner {
        require(_token != address(0), "Use native token address 0x0");
        supportedTokens[_token] = true;
        emit TokenAdded(_token);
    }

    /**
     * @dev Remove supported ERC20 token (admin only)
     */
    function removeSupportedToken(address _token) external onlyOwner {
        require(_token != address(0), "Cannot remove native token");
        supportedTokens[_token] = false;
        emit TokenRemoved(_token);
    }

    /**
     * @dev Create bill with NATIVE token (ETH, MATIC, BNB, etc.)
     * @param _platformFee The platform fee amount
     */
    function createBill(uint256 _platformFee) external payable nonReentrant whenNotPaused {
        require(msg.value > _platformFee, "Amount must exceed fee");
        require(msg.value > 0, "Must send crypto");

        billCounter++;
        bills[billCounter] = Bill({
            billMaker: msg.sender,
            payer: address(0),
            token: address(0), // Native token
            amount: msg.value - _platformFee,
            platformFee: _platformFee,
            fiatConfirmed: false,
            disputed: false,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + 7 days
        });

        emit BillCreated(billCounter, msg.sender, address(0), msg.value - _platformFee, _platformFee);
    }

    /**
     * @dev Create bill with ERC20 token (USDT, USDC, etc.)
     * @param _token The ERC20 token address
     * @param _amount The amount to lock (excluding fee)
     * @param _platformFee The platform fee amount
     *
     * NOTE: User must approve this contract to spend tokens first!
     */
    function createBillWithToken(
        address _token,
        uint256 _amount,
        uint256 _platformFee
    ) external nonReentrant whenNotPaused {
        require(_token != address(0), "Use createBill for native tokens");
        require(supportedTokens[_token], "Token not supported");
        require(_amount > 0, "Amount must be > 0");

        uint256 totalAmount = _amount + _platformFee;

        // Transfer tokens from user to contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), totalAmount);

        billCounter++;
        bills[billCounter] = Bill({
            billMaker: msg.sender,
            payer: address(0),
            token: _token,
            amount: _amount,
            platformFee: _platformFee,
            fiatConfirmed: false,
            disputed: false,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + 7 days
        });

        emit BillCreated(billCounter, msg.sender, _token, _amount, _platformFee);
    }

    /**
     * @dev Payer claims a bill
     * @param _billId The bill ID to claim
     */
    function claimBill(uint256 _billId) external nonReentrant whenNotPaused {
        Bill storage bill = bills[_billId];
        require(bill.payer == address(0), "Already claimed");
        require(bill.amount > 0, "Bill not found or empty");
        require(msg.sender != bill.billMaker, "Cannot claim own bill");
        require(!bill.disputed, "Bill is disputed");
        require(block.timestamp < bill.expiresAt, "Bill expired");

        bill.payer = msg.sender;
        emit BillClaimed(_billId, msg.sender);
    }

    /**
     * @dev Bill Maker confirms fiat payment received, releases crypto to Payer
     * @param _billId The bill ID to confirm
     */
    function confirmFiatPayment(uint256 _billId) external nonReentrant whenNotPaused {
        Bill storage bill = bills[_billId];
        require(msg.sender == bill.billMaker, "Only bill maker");
        require(bill.payer != address(0), "Not claimed");
        require(!bill.fiatConfirmed, "Already confirmed");
        require(!bill.disputed, "Bill disputed");
        require(bill.amount > 0, "No funds");

        bill.fiatConfirmed = true;

        uint256 payoutAmount = bill.amount;
        uint256 feeAmount = bill.platformFee;
        address token = bill.token;
        address payer = bill.payer;

        bill.amount = 0;
        bill.platformFee = 0;

        if (token == address(0)) {
            // Native token transfer
            (bool payerSuccess, ) = payable(payer).call{value: payoutAmount}("");
            require(payerSuccess, "Payer transfer failed");

            if (feeAmount > 0) {
                (bool feeSuccess, ) = payable(feeWallet).call{value: feeAmount}("");
                require(feeSuccess, "Fee transfer failed");
            }
        } else {
            // ERC20 token transfer
            IERC20(token).safeTransfer(payer, payoutAmount);

            if (feeAmount > 0) {
                IERC20(token).safeTransfer(feeWallet, feeAmount);
            }
        }

        emit FiatConfirmed(_billId);
        emit CryptoReleased(_billId, payer, token, payoutAmount);
    }

    /**
     * @dev Raise a dispute (both bill maker and payer can)
     * @param _billId The bill ID to dispute
     */
    function raiseDispute(uint256 _billId) external {
        Bill storage bill = bills[_billId];
        require(
            msg.sender == bill.billMaker || msg.sender == bill.payer,
            "Not authorized"
        );
        require(!bill.fiatConfirmed, "Already completed");
        require(!bill.disputed, "Already disputed");
        require(bill.amount > 0, "No funds");

        bill.disputed = true;
        emit Disputed(_billId, msg.sender);
    }

    /**
     * @dev Admin resolves dispute
     * @param _billId The bill ID to resolve
     * @param _releaseToPayer True to release to payer, false to refund bill maker
     */
    function resolveDispute(uint256 _billId, bool _releaseToPayer) external onlyOwner nonReentrant {
        Bill storage bill = bills[_billId];
        require(bill.disputed, "Not disputed");
        require(bill.amount > 0 || bill.platformFee > 0, "No funds");

        uint256 payoutAmount = bill.amount;
        uint256 feeAmount = bill.platformFee;
        address token = bill.token;
        address payer = bill.payer;
        address billMaker = bill.billMaker;

        bill.amount = 0;
        bill.platformFee = 0;
        bill.disputed = false;

        if (_releaseToPayer && payer != address(0)) {
            // Payer wins - gets crypto, platform gets fee
            if (token == address(0)) {
                (bool payerSuccess, ) = payable(payer).call{value: payoutAmount}("");
                require(payerSuccess, "Payer transfer failed");

                if (feeAmount > 0) {
                    (bool feeSuccess, ) = payable(feeWallet).call{value: feeAmount}("");
                    require(feeSuccess, "Fee transfer failed");
                }
            } else {
                IERC20(token).safeTransfer(payer, payoutAmount);
                if (feeAmount > 0) {
                    IERC20(token).safeTransfer(feeWallet, feeAmount);
                }
            }
            emit DisputeResolved(_billId, true);
        } else {
            // Bill maker wins - gets everything back
            uint256 totalAmount = payoutAmount + feeAmount;
            if (token == address(0)) {
                (bool success, ) = payable(billMaker).call{value: totalAmount}("");
                require(success, "Refund transfer failed");
            } else {
                IERC20(token).safeTransfer(billMaker, totalAmount);
            }
            emit DisputeResolved(_billId, false);
        }
    }

    /**
     * @dev Refund expired bill (anyone can call, funds go to bill maker)
     * @param _billId The bill ID to refund
     */
    function refundExpiredBill(uint256 _billId) external nonReentrant {
        Bill storage bill = bills[_billId];
        require(block.timestamp > bill.expiresAt, "Not expired");
        require(bill.payer == address(0), "Already claimed");
        require(bill.amount > 0 || bill.platformFee > 0, "No funds");

        uint256 totalAmount = bill.amount + bill.platformFee;
        address token = bill.token;
        address billMaker = bill.billMaker;

        bill.amount = 0;
        bill.platformFee = 0;

        if (token == address(0)) {
            (bool success, ) = payable(billMaker).call{value: totalAmount}("");
            require(success, "Refund transfer failed");
        } else {
            IERC20(token).safeTransfer(billMaker, totalAmount);
        }

        emit Refunded(_billId, billMaker);
    }

    /**
     * @dev Bill maker cancels unclaimed bill
     * @param _billId The bill ID to cancel
     */
    function cancelBill(uint256 _billId) external nonReentrant {
        Bill storage bill = bills[_billId];
        require(msg.sender == bill.billMaker, "Only bill maker");
        require(bill.payer == address(0), "Already claimed");
        require(bill.amount > 0 || bill.platformFee > 0, "No funds");

        uint256 totalAmount = bill.amount + bill.platformFee;
        address token = bill.token;

        bill.amount = 0;
        bill.platformFee = 0;

        if (token == address(0)) {
            (bool success, ) = payable(bill.billMaker).call{value: totalAmount}("");
            require(success, "Refund transfer failed");
        } else {
            IERC20(token).safeTransfer(bill.billMaker, totalAmount);
        }

        emit Refunded(_billId, bill.billMaker);
    }

    // ============ View Functions ============

    /**
     * @dev Get bill details
     */
    function getBill(uint256 _billId) external view returns (Bill memory) {
        return bills[_billId];
    }

    /**
     * @dev Check if bill has locked funds
     */
    function isLocked(uint256 _billId) external view returns (bool) {
        return bills[_billId].amount > 0;
    }

    /**
     * @dev Get bill status
     */
    function getBillStatus(uint256 _billId) external view returns (
        bool exists,
        bool claimed,
        bool confirmed,
        bool disputed,
        bool expired
    ) {
        Bill storage bill = bills[_billId];
        exists = bill.billMaker != address(0);
        claimed = bill.payer != address(0);
        confirmed = bill.fiatConfirmed;
        disputed = bill.disputed;
        expired = block.timestamp > bill.expiresAt;
    }

    /**
     * @dev Check if token is supported
     */
    function isTokenSupported(address _token) external view returns (bool) {
        return supportedTokens[_token];
    }

    // ============ Admin Functions ============

    /**
     * @dev Update fee wallet
     */
    function setFeeWallet(address _newFeeWallet) external onlyOwner {
        require(_newFeeWallet != address(0), "Invalid address");
        address oldWallet = feeWallet;
        feeWallet = _newFeeWallet;
        emit FeeWalletUpdated(oldWallet, _newFeeWallet);
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw native tokens (only if contract is paused)
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdraw failed");
    }

    /**
     * @dev Emergency withdraw ERC20 tokens (only if contract is paused)
     */
    function emergencyWithdrawToken(address _token) external onlyOwner whenPaused {
        require(_token != address(0), "Use emergencyWithdraw for native");
        uint256 balance = IERC20(_token).balanceOf(address(this));
        require(balance > 0, "No token balance");
        IERC20(_token).safeTransfer(owner(), balance);
    }

    // Receive function to accept ETH/MATIC
    receive() external payable {}
}
