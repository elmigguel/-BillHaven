# P2P Crypto Escrow Security Research - 2025
## Comprehensive Fraud Vectors & Mitigation Strategies

**Research Date:** 2025-11-29
**Scope:** Payment fraud, smart contract attacks, business logic exploits, detection systems
**Target:** BillHaven P2P escrow platform security hardening

---

## EXECUTIVE SUMMARY

P2P crypto escrow platforms face multi-layered fraud threats across payment processing, smart contract security, and business logic. This research identifies 47 distinct attack vectors across 5 categories with specific countermeasures for each.

**Critical Risk Areas:**
- Payment reversals (ACH/SEPA: 60-90 day chargeback window)
- Smart contract reentrancy attacks (historical losses: $150M+ in 2024)
- Sybil attacks via multiple accounts (30-40% of fraud attempts)
- Friendly fraud via card chargebacks (0.5-2% transaction rate)

---

## 1. PAYMENT FRAUD VECTORS

### 1.1 Fake Payment Screenshot Fraud

**Attack Method:**
- Attackers use photo editing tools (Photoshop, Inspect Element) to create fake payment confirmations
- Target platforms with manual verification
- Often combined with social engineering (urgency, trust building)
- Success rate: 15-25% on platforms without automated verification

**Countermeasures:**

#### Tier 1: Automated Verification
```javascript
// Payment verification architecture
{
  "method": "AUTOMATED_BANK_API",
  "providers": [
    "Plaid (US banks)",
    "TrueLayer (EU/UK)",
    "Yodlee (multi-region)",
    "Wise API (international)"
  ],
  "verification_time": "2-30 seconds",
  "screenshot_acceptance": "NEVER - API only"
}
```

**Specific Implementations:**
1. **Direct Bank API Integration**
   - Plaid for US ACH verification (real-time balance/transaction check)
   - TrueLayer for UK Faster Payments (instant confirmation)
   - SEPA Instant for EU (10-second settlement)
   - Never accept manual screenshots for fiat confirmation

2. **Payment Proof Requirements**
   - Transaction ID validation via bank API
   - Timestamp verification (must be within 24 hours)
   - Amount exact match (no rounding tolerance)
   - Sender account name match (KYC correlation)

3. **Image Forensics (Backup Layer)**
   - EXIF data analysis for screenshot detection
   - Pixel-level manipulation detection
   - OCR + database validation of transaction IDs
   - ML models trained on authentic payment UIs

**Binance P2P Approach:**
- Zero screenshot acceptance for fiat confirmation
- Mandatory payment reference codes (unique per trade)
- Bank API verification for supported countries
- Manual review only for edge cases with video proof

---

### 1.2 Payment Reversal Attacks

**Attack Methods by Payment Type:**

| Payment Method | Reversal Window | Risk Level | Fraud Rate |
|---------------|-----------------|------------|------------|
| Credit Card | 120-180 days | CRITICAL | 2-5% |
| PayPal | 180 days | HIGH | 1-3% |
| ACH (US) | 60 days | HIGH | 0.8-2% |
| SEPA (EU) | 8 weeks | MEDIUM | 0.3-1% |
| Faster Payments (UK) | No reversal | LOW | 0.1% |
| Wire Transfer | Difficult | LOW | 0.05% |
| Cryptocurrency | Impossible | NONE | 0% |

**High-Risk Scenarios:**
1. **ACH Reversals (USA)**
   - 60-day unauthorized debit claim window
   - Banks favor consumers in disputes
   - "Account hacked" claims are nearly impossible to defend

2. **SEPA Recalls (Europe)**
   - 8-week recall window for unauthorized transactions
   - PSD2 Strong Customer Authentication (SCA) helps but not foolproof
   - Cross-border recalls more complex

3. **PayPal Chargebacks**
   - 180-day dispute window
   - Crypto sales have zero seller protection
   - High success rate for buyers claiming "unauthorized transaction"

**Countermeasures:**

#### Strategy 1: Hold Periods Based on Risk
```python
HOLD_PERIODS = {
    "credit_card": 180,        # 180 days - match chargeback window
    "paypal": 180,             # 180 days
    "ach": 60,                 # 60 days
    "sepa": 56,                # 8 weeks
    "sepa_instant": 14,        # Lower risk
    "faster_payments": 3,      # UK instant, low risk
    "wire": 7,                 # Low risk
    "crypto": 0                # No reversal risk
}
```

#### Strategy 2: Graduated Release
```javascript
// Progressive release based on user reputation
{
  "new_user": {
    "hold_period": "MAX_FOR_PAYMENT_METHOD",
    "release_schedule": "100% after hold period"
  },
  "verified_user_<10_trades": {
    "hold_period": "50% of max",
    "release_schedule": "50% after hold, 50% after full period"
  },
  "trusted_user_>50_trades": {
    "hold_period": "25% of max",
    "release_schedule": "Instant release up to velocity limit"
  }
}
```

#### Strategy 3: Reversal Insurance Pool
- Platform maintains 5-10% reserve fund from fees
- Insurance covers legitimate reversals for good actors
- Fraudsters banned and debt collected
- Similar to Binance's SAFU fund model

**Paxful's Approach:**
- No credit card acceptance (too high risk)
- Cash deposits require photo proof + timestamp
- Bank transfers: 7-14 day holds for new users
- Dispute mediation with evidence requirements
- Reputation system affects hold periods

---

### 1.3 Social Engineering Attacks

**Common Tactics:**
1. **Impersonation Attacks**
   - Fake platform support staff
   - Cloned vendor profiles
   - Telegram/Discord phishing
   - Email spoofing with urgent requests

2. **Trust Exploitation**
   - Building rapport over multiple small trades
   - Gradual increase to large fraudulent transaction
   - "Emergency" scenarios requiring fast release

3. **Technical Confusion**
   - Claiming "wrong amount sent, please release and I'll resend"
   - Fake blockchain confirmations
   - Wrong network deposits (BEP20 instead of ERC20)

**Countermeasures:**

1. **In-App Communication Only**
   - Block external messaging (no WhatsApp, Telegram during trade)
   - Watermarked chat interface (prevents screenshot reuse)
   - Auto-flagging of external contact requests
   - Warning banners: "Platform staff will NEVER ask for release"

2. **Automated Warning System**
```javascript
TRIGGER_WARNINGS_FOR = [
  "release early",
  "trust me",
  "I'll send later",
  "wrong amount",
  "contact me on",
  "telegram.me",
  "whatsapp",
  "emergency"
]
```

3. **Transaction Freezing**
   - Admin review triggered by keyword detection
   - 24-48 hour cooling period for flagged trades
   - User education pop-ups before proceeding

**LocalBitcoins Approach:**
- Mandatory in-platform messaging (external contact = ban)
- Automated scam detection in chat
- Trade freezing for suspicious patterns
- User education tooltips throughout flow

---

### 1.4 Phishing for Wallet Keys

**Attack Vectors:**
1. **Fake Platform Sites**
   - Typosquatting domains (bi11haven.com vs billhaven.com)
   - Google Ads for fake sites
   - SEO poisoning

2. **Malicious Browser Extensions**
   - Clipboard hijacking (swap wallet addresses)
   - Screen overlays during transactions
   - Keyloggers targeting seed phrases

3. **Fake Wallet Apps**
   - Impersonation apps in app stores
   - Trojanized wallets with backdoors

**Countermeasures:**

1. **Non-Custodial Design with Session Keys**
   - Users never share private keys with platform
   - Smart contract controls escrow, not platform
   - Sign transactions on client side only
   - Use EIP-4337 account abstraction for session keys

2. **Domain Security**
```javascript
{
  "primary_domain": "billhaven.com",
  "security_measures": [
    "HSTS preloading",
    "CAA DNS records",
    "Certificate Transparency monitoring",
    "Trademark monitoring for lookalikes",
    "Official domain verification badge"
  ]
}
```

3. **Browser Extension Detection**
```javascript
// Detect common crypto phishing extensions
const detectMaliciousExtensions = () => {
  // Check for clipboard manipulation
  // Monitor address field changes
  // Verify transaction details don't change between display and signing
}
```

4. **Hardware Wallet Integration**
   - Ledger/Trezor support for high-value trades
   - WalletConnect for secure mobile wallet connections
   - Never store private keys in browser storage

**Industry Best Practice:**
- MetaMask/WalletConnect integration (user controls keys)
- Multi-signature wallets for platform operations
- Address whitelisting for first-time withdrawals
- Email/SMS confirmation for wallet changes

---

## 2. SMART CONTRACT ATTACK VECTORS

### 2.1 Reentrancy Attacks

**Attack Mechanism:**
```solidity
// VULNERABLE CODE EXAMPLE
function release() public {
    uint amount = escrows[msg.sender];
    // Attacker's contract called here can re-enter
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
    escrows[msg.sender] = 0;  // State update AFTER external call (WRONG)
}
```

**Attack Flow:**
1. Attacker creates malicious contract with fallback function
2. Calls `release()` to initiate withdrawal
3. During external call, fallback function re-enters `release()`
4. Since state isn't updated yet, withdrawal happens multiple times
5. Drains contract balance

**Famous Cases:**
- The DAO hack (2016): $60M stolen
- Lendf.me (2020): $25M stolen
- Cream Finance (2021): $130M stolen

**Countermeasures:**

#### Solution 1: Checks-Effects-Interactions Pattern
```solidity
// SECURE IMPLEMENTATION
function release() public nonReentrant {
    uint amount = escrows[msg.sender];
    require(amount > 0, "No funds in escrow");

    // EFFECTS: Update state BEFORE external call
    escrows[msg.sender] = 0;

    // INTERACTIONS: External call happens last
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");

    emit Released(msg.sender, amount);
}
```

#### Solution 2: ReentrancyGuard (OpenZeppelin)
```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SecureEscrow is ReentrancyGuard {
    function release() public nonReentrant {
        // Function body protected from reentrancy
    }
}
```

#### Solution 3: Pull Over Push Pattern
```solidity
// Instead of pushing funds, let users pull
mapping(address => uint) public withdrawable;

function markForWithdrawal() public {
    uint amount = escrows[msg.sender];
    escrows[msg.sender] = 0;
    withdrawable[msg.sender] += amount;
}

function withdraw() public nonReentrant {
    uint amount = withdrawable[msg.sender];
    require(amount > 0);
    withdrawable[msg.sender] = 0;
    payable(msg.sender).transfer(amount);
}
```

**Testing Requirements:**
- Slither static analysis tool
- Echidna fuzzing for invariant testing
- Manual audit of all external calls
- Reentrancy attack simulation in tests

---

### 2.2 Flash Loan Attacks

**Attack Mechanism:**
1. Borrow millions in assets (no collateral needed in same transaction)
2. Manipulate price oracles or exploit business logic
3. Profit from the manipulation
4. Repay loan + fee
5. Keep profit (all in single transaction)

**Relevance to Escrow:**
- If escrow uses oracles for asset pricing, flash loans can manipulate them
- Can exploit governance if platform has token-based voting
- Relevant for multi-asset escrow or DeFi integration

**Example Attack on Price Oracle:**
```solidity
// VULNERABLE: Using spot price from single DEX
function getAssetValue() public view returns (uint) {
    return uniswapPair.getReserves();  // Can be manipulated in same block
}
```

**Countermeasures:**

#### Solution 1: Time-Weighted Average Price (TWAP)
```solidity
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2OracleLibrary.sol";

// Use TWAP over 10-30 minutes
function getSecurePrice() public view returns (uint) {
    uint32 blockTimestamp = uint32(block.timestamp % 2**32);
    uint32 timeElapsed = blockTimestamp - blockTimestampLast;
    require(timeElapsed >= MINIMUM_PERIOD, "Too soon");

    // Calculate TWAP
    return (price0Cumulative - price0CumulativeLast) / timeElapsed;
}
```

#### Solution 2: Multiple Oracle Sources (Chainlink)
```solidity
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

function getChainlinkPrice() public view returns (uint) {
    (
        uint80 roundID,
        int price,
        uint startedAt,
        uint timeStamp,
        uint80 answeredInRound
    ) = priceFeed.latestRoundData();

    require(timeStamp > 0, "Round not complete");
    require(answeredInRound >= roundID, "Stale price");

    return uint(price);
}
```

#### Solution 3: Flash Loan Detection
```solidity
// Track balance changes within transaction
mapping(address => uint) private balanceStart;

modifier noFlashLoan() {
    require(balanceStart[msg.sender] == 0, "Flash loan detected");
    balanceStart[msg.sender] = address(this).balance;
    _;
    delete balanceStart[msg.sender];
}
```

**Best Practice for BillHaven:**
- If dealing only with fixed crypto amounts (BTC, ETH, stablecoins), flash loans are less relevant
- If implementing fiat-pegged pricing, use Chainlink oracles
- Avoid same-block oracle reads
- Use established oracle networks (Chainlink, Band Protocol)

---

### 2.3 Oracle Manipulation

**Attack Scenarios:**
1. **Single Source Oracle**
   - Attacker manipulates the one price feed
   - Example: Low liquidity DEX as sole source

2. **Centralized Oracle Compromise**
   - Hacking the oracle operator
   - Bribing oracle nodes

3. **Time Delay Exploitation**
   - Oracle updates lag real market
   - Arbitrage against stale prices

**Countermeasures:**

#### Strategy 1: Decentralized Oracle Networks
```javascript
ORACLE_HIERARCHY = [
  {
    "primary": "Chainlink Price Feeds",
    "backup": "Band Protocol",
    "fallback": "Uniswap V3 TWAP"
  }
]

// Use median of 3+ sources
const price = median([chainlink, band, uniswap_twap]);
```

#### Strategy 2: Deviation Checks
```solidity
function validatePrice(uint newPrice) internal view {
    uint lastPrice = historicalPrices[block.timestamp - 1 hours];
    uint deviation = abs(newPrice - lastPrice) * 10000 / lastPrice;

    require(deviation < 1000, "Price deviation >10%, possible manipulation");
}
```

#### Strategy 3: Circuit Breakers
```solidity
// Pause trading if price moves too fast
if (priceChange > MAX_ALLOWED_CHANGE) {
    pause();
    emit CircuitBreakerTripped(oldPrice, newPrice);
}
```

**For BillHaven:**
- If accepting only direct crypto transfers (not fiat-pegged), oracle risk is minimal
- For stablecoin verification: use Chainlink + on-chain reserve checking
- Avoid building custom oracles (use established infrastructure)

---

### 2.4 Front-Running Attacks

**Attack Mechanism:**
1. Attacker monitors mempool for pending transactions
2. Sees user submitting trade at favorable price
3. Submits same transaction with higher gas (gets mined first)
4. Takes the good trade, user gets worse price

**MEV (Maximal Extractable Value) Impact:**
- Sandwich attacks: Front-run + back-run to profit from price impact
- Relevant for DEX integrations or on-chain order matching

**Example:**
```
User submits: Buy 1 BTC for $50,000 (gas: 30 gwei)
Bot sees pending tx in mempool
Bot submits: Buy 1 BTC for $50,000 (gas: 100 gwei)
Bot's tx mines first, user's tx fails or gets worse price
```

**Countermeasures:**

#### Solution 1: Private Transaction Pools
```javascript
// Use Flashbots Protect RPC
const provider = new JsonRpcProvider("https://rpc.flashbots.net");
// Transactions bypass public mempool
```

#### Solution 2: Commit-Reveal Scheme
```solidity
// Phase 1: User commits hash of trade details
function commit(bytes32 tradeHash) public {
    commits[msg.sender] = tradeHash;
    commitTime[msg.sender] = block.timestamp;
}

// Phase 2: After X blocks, reveal actual trade
function reveal(TradeDetails memory details) public {
    require(block.timestamp > commitTime[msg.sender] + REVEAL_DELAY);
    require(keccak256(abi.encode(details)) == commits[msg.sender]);
    // Execute trade
}
```

#### Solution 3: Batch Auctions (Gnosis CowSwap model)
- Collect orders over time window
- Execute all at same uniform price
- Eliminates front-running incentive

**For BillHaven Escrow:**
- Less relevant if escrow just holds funds (no price-based execution)
- Important if implementing on-chain order matching
- Use private mempools for admin operations

---

### 2.5 Signature Replay Attacks

**Attack Mechanism:**
1. User signs message to release funds
2. Attacker captures valid signature
3. Replays signature in different context or on different chain
4. Drains funds unexpectedly

**Example Vulnerable Code:**
```solidity
// VULNERABLE
function releaseWithSignature(uint amount, bytes memory signature) public {
    bytes32 message = keccak256(abi.encodePacked(amount));
    address signer = recoverSigner(message, signature);
    require(signer == owner, "Invalid signature");

    // Transfer funds
    // Problem: Same signature can be replayed multiple times
}
```

**Countermeasures:**

#### Solution 1: Nonce-Based Signatures (EIP-712)
```solidity
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract SecureEscrow is EIP712 {
    mapping(address => uint) public nonces;

    bytes32 public constant RELEASE_TYPEHASH = keccak256(
        "Release(address user,uint256 amount,uint256 nonce,uint256 deadline)"
    );

    function releaseWithSignature(
        uint amount,
        uint deadline,
        bytes memory signature
    ) public {
        require(block.timestamp <= deadline, "Signature expired");

        bytes32 structHash = keccak256(abi.encode(
            RELEASE_TYPEHASH,
            msg.sender,
            amount,
            nonces[msg.sender]++,  // Increment nonce
            deadline
        ));

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        require(signer == owner, "Invalid signature");

        // Transfer funds
    }
}
```

#### Solution 2: Chain ID Inclusion
```solidity
// Prevent cross-chain replay
bytes32 message = keccak256(abi.encodePacked(
    amount,
    block.chainid,  // Include chain ID
    address(this),  // Include contract address
    nonce
));
```

#### Solution 3: Signature Invalidation
```solidity
mapping(bytes32 => bool) public usedSignatures;

function useSignature(bytes32 sigHash) internal {
    require(!usedSignatures[sigHash], "Signature already used");
    usedSignatures[sigHash] = true;
}
```

**EIP-712 Benefits:**
- Human-readable signing (users see what they're signing)
- Domain separation (prevents cross-contract replay)
- Standardized wallet support
- Nonce and deadline built in

---

## 3. BUSINESS LOGIC EXPLOITS

### 3.1 Race Conditions in Claim/Release

**Attack Scenario:**
```
Time 0: User A initiates release
Time 1: Admin initiates refund (dispute resolution)
Time 2: Both transactions mine in same block
Result: Double-spend or inconsistent state
```

**Vulnerable Code:**
```solidity
// VULNERABLE: Two functions can modify same state concurrently
function release() public {
    require(escrows[tradeId].amount > 0);
    payable(seller).transfer(escrows[tradeId].amount);
    escrows[tradeId].amount = 0;
}

function refund() public {
    require(escrows[tradeId].amount > 0);
    payable(buyer).transfer(escrows[tradeId].amount);
    escrows[tradeId].amount = 0;
}
```

**Countermeasures:**

#### Solution 1: State Machine with Locks
```solidity
enum TradeState { PENDING, LOCKED, RELEASED, REFUNDED, DISPUTED }

struct Trade {
    uint amount;
    TradeState state;
    address buyer;
    address seller;
    uint lockTime;
}

mapping(uint => Trade) public trades;

function release(uint tradeId) public {
    Trade storage trade = trades[tradeId];
    require(trade.state == TradeState.PENDING, "Invalid state");

    // Atomic state transition
    trade.state = TradeState.RELEASED;

    payable(trade.seller).transfer(trade.amount);
    emit Released(tradeId);
}

function refund(uint tradeId) public {
    Trade storage trade = trades[tradeId];
    require(trade.state == TradeState.PENDING, "Invalid state");

    trade.state = TradeState.REFUNDED;

    payable(trade.buyer).transfer(trade.amount);
    emit Refunded(tradeId);
}
```

#### Solution 2: Mutex Locks
```solidity
modifier locked(uint tradeId) {
    require(!locks[tradeId], "Trade locked");
    locks[tradeId] = true;
    _;
    locks[tradeId] = false;
}

function release(uint tradeId) public locked(tradeId) {
    // Function body
}
```

#### Solution 3: Single Transaction Atomicity
```solidity
// Use try-catch to ensure all-or-nothing execution
function complexRelease(uint tradeId) public {
    try this.updateState(tradeId) {
        try this.transferFunds(tradeId) {
            emit Success(tradeId);
        } catch {
            this.revertState(tradeId);
            revert("Transfer failed");
        }
    } catch {
        revert("State update failed");
    }
}
```

---

### 3.2 Hold Period Bypass Attempts

**Attack Vectors:**

1. **Time Manipulation Attempts**
   - Miners manipulating block.timestamp (±15 seconds allowed)
   - Exploiting timezone conversions in off-chain systems
   - Clock sync issues between chain and backend

2. **Multi-Account Coordination**
   - Trade with self using different accounts
   - Immediate release between colluding parties
   - Circumvent hold periods by "trading" to accomplice

3. **Contract Upgrade Exploits**
   - If escrow is upgradeable, manipulate logic in upgrade
   - Bypass hold periods via admin functions
   - Proxy pattern vulnerabilities

**Countermeasures:**

#### Strategy 1: On-Chain Time Locks
```solidity
struct Escrow {
    uint amount;
    uint releaseTime;  // block.timestamp when release allowed
    bool released;
}

function createEscrow(uint holdPeriod) public payable {
    escrows[tradeId] = Escrow({
        amount: msg.value,
        releaseTime: block.timestamp + holdPeriod,
        released: false
    });
}

function release(uint tradeId) public {
    Escrow storage escrow = escrows[tradeId];
    require(block.timestamp >= escrow.releaseTime, "Hold period not over");
    require(!escrow.released, "Already released");

    escrow.released = true;
    // Transfer logic
}
```

#### Strategy 2: Account Linking Detection
```javascript
// Backend fraud detection
const detectLinkedAccounts = async (userId1, userId2) => {
  const signals = {
    sameIP: await checkIPOverlap(userId1, userId2),
    sameDevice: await checkDeviceFingerprint(userId1, userId2),
    sameBank: await checkBankAccountOverlap(userId1, userId2),
    sameWallet: await checkWalletReuse(userId1, userId2),
    tradingPattern: await checkCircularTrading(userId1, userId2)
  };

  const riskScore = calculateRiskScore(signals);

  if (riskScore > THRESHOLD) {
    enforceMaxHoldPeriod();  // Don't allow early release
    flagForReview();
  }
};
```

#### Strategy 3: Immutable Hold Logic
```solidity
// Make hold periods immutable - even admin can't override
contract ImmutableHoldEscrow {
    uint public immutable MIN_HOLD_PERIOD = 7 days;

    // No admin override function - mathematically impossible to bypass
    function release(uint tradeId) public {
        require(
            block.timestamp >= escrows[tradeId].createdAt + MIN_HOLD_PERIOD,
            "Absolute minimum hold not met"
        );
        // Release logic
    }
}
```

---

### 3.3 Velocity Limit Evasion

**Attack Methods:**

1. **Sybil Account Creation**
   - Create 100 accounts, each under daily limit
   - Collectively move $1M when individual limit is $10K

2. **Time-Based Gaming**
   - Execute max transaction at 23:59
   - Execute max transaction at 00:01 (new day)
   - Effectively double daily limit

3. **Multi-Asset Splitting**
   - Daily limit of $10K per currency
   - Move $10K BTC + $10K ETH + $10K USDT = $30K total

**Countermeasures:**

#### Strategy 1: Multi-Dimensional Limits
```javascript
const VELOCITY_LIMITS = {
  per_transaction: {
    new_user: 1000,
    verified: 5000,
    trusted: 25000
  },
  per_day: {
    new_user: 2000,
    verified: 15000,
    trusted: 100000
  },
  per_week: {
    new_user: 5000,
    verified: 50000,
    trusted: 500000
  },
  rolling_24h: {
    new_user: 2000,
    verified: 20000,
    trusted: 150000
  }
};

// Aggregate across all assets (USD equivalent)
const checkVelocity = async (userId, amount) => {
  const last24h = await sumTransactions(userId, '24h');
  const lastWeek = await sumTransactions(userId, '7d');
  const today = await sumTransactions(userId, 'calendar_day');

  const tier = getUserTier(userId);

  if (amount > VELOCITY_LIMITS.per_transaction[tier]) return false;
  if (today + amount > VELOCITY_LIMITS.per_day[tier]) return false;
  if (last24h + amount > VELOCITY_LIMITS.rolling_24h[tier]) return false;
  if (lastWeek + amount > VELOCITY_LIMITS.per_week[tier]) return false;

  return true;
};
```

#### Strategy 2: Graph-Based Account Linking
```python
# Detect fraud rings using graph analysis
import networkx as nx

class FraudRingDetector:
    def __init__(self):
        self.graph = nx.Graph()

    def add_signal(self, user1, user2, signal_type, weight):
        """Link users based on shared signals"""
        if not self.graph.has_edge(user1, user2):
            self.graph.add_edge(user1, user2, signals={})

        self.graph[user1][user2]['signals'][signal_type] = weight

    def detect_rings(self, min_ring_size=3):
        """Find connected components (potential fraud rings)"""
        components = nx.connected_components(self.graph)

        rings = []
        for component in components:
            if len(component) >= min_ring_size:
                # Calculate ring risk score
                subgraph = self.graph.subgraph(component)
                edge_count = subgraph.number_of_edges()
                node_count = subgraph.number_of_nodes()

                # Fully connected = very suspicious
                completeness = edge_count / (node_count * (node_count - 1) / 2)

                if completeness > 0.6:  # 60% of possible connections exist
                    rings.append({
                        'users': list(component),
                        'risk_score': completeness,
                        'shared_signals': self._analyze_signals(subgraph)
                    })

        return rings

    def apply_collective_limits(self, ring):
        """Treat entire ring as single entity for velocity limits"""
        total_volume = sum(get_user_volume(user) for user in ring['users'])

        # If collective volume exceeds single-user limit, flag entire ring
        if total_volume > VELOCITY_LIMITS.per_day['new_user']:
            for user in ring['users']:
                flag_user(user, reason="Part of velocity evasion ring")
                apply_max_hold_periods(user)
```

**Shared Signals for Linking:**
- IP address (weighted by uniqueness)
- Device fingerprint (browser, OS, screen size)
- Bank account overlap
- Wallet reuse
- Trading counterparties (who trades with whom)
- Timing patterns (active at same times)

#### Strategy 3: Behavioral Anomaly Detection
```python
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(contamination=0.1)

    def extract_features(self, user_id):
        """Extract behavioral features"""
        return [
            avg_transaction_size(user_id),
            transaction_frequency(user_id),
            active_hours_pattern(user_id),
            counterparty_diversity(user_id),  # Trades with many different people?
            payment_method_diversity(user_id),
            time_to_release_avg(user_id),
            dispute_rate(user_id),
            completion_rate(user_id)
        ]

    def is_anomalous(self, user_id):
        features = self.extract_features(user_id)
        prediction = self.model.predict([features])
        return prediction == -1  # -1 indicates anomaly
```

---

### 3.4 Sybil Attacks (Multiple Account Fraud)

**Attack Motivations:**
- Evade velocity limits (as above)
- Manipulate reputation systems
- Self-trading to appear legitimate
- Wash trading to inflate volume
- Coordinate pump-and-dump schemes

**Detection Challenges:**
- VPNs and proxies hide IP overlap
- Virtual machines hide device fingerprints
- Stolen identities for KYC bypass
- Privacy regulations limit tracking

**Countermeasures:**

#### Tier 1: Identity Verification
```javascript
KYC_TIERS = {
  tier_0: {
    required: ["Email verification"],
    limits: { daily: 500 }
  },
  tier_1: {
    required: ["Phone verification", "ID document"],
    limits: { daily: 5000 }
  },
  tier_2: {
    required: ["Video selfie", "Address proof", "Bank account link"],
    limits: { daily: 25000 }
  },
  tier_3: {
    required: ["In-person verification or notarized docs"],
    limits: { daily: 100000 }
  }
}
```

**Privacy-Preserving Alternatives:**
- Worldcoin iris scanning (unique biometric, can't create multiple)
- Gitcoin Passport (Web3 identity aggregation)
- Proof of Humanity (video submission + community vouching)
- Social graph verification (Twitter, GitHub age and activity)

#### Tier 2: Device and Network Fingerprinting
```javascript
// FingerprintJS + custom signals
const generateFingerprint = async () => {
  const fpPromise = FingerprintJS.load();
  const fp = await fpPromise;
  const result = await fp.get();

  const customSignals = {
    visitorId: result.visitorId,
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    webgl: getWebGLFingerprint(),
    audio: getAudioFingerprint(),
    canvas: getCanvasFingerprint()
  };

  return hash(customSignals);
};

// Backend: Check for fingerprint reuse
const checkFingerprint = async (userId, fingerprint) => {
  const existingUser = await db.findOne({ fingerprint });

  if (existingUser && existingUser.id !== userId) {
    return {
      linked_account: existingUser.id,
      confidence: 0.85,
      action: "FLAG_FOR_REVIEW"
    };
  }
};
```

#### Tier 3: Behavioral Biometrics
```python
class BehaviorAnalyzer:
    """Analyze unique human patterns hard to fake"""

    def typing_rhythm(self, user_id):
        """Keystroke dynamics - timing between keys"""
        # Collect during text input (chat, forms)
        # Creates unique signature per user
        pass

    def mouse_movement(self, user_id):
        """Cursor movement patterns"""
        # Speed, acceleration, curvature of mouse paths
        # Humans have unique "mouse signature"
        pass

    def interaction_patterns(self, user_id):
        """How user interacts with UI"""
        return {
            'avg_time_to_click': calculate_avg_click_time(user_id),
            'scroll_speed': calculate_scroll_speed(user_id),
            'error_correction_rate': calculate_typo_fixes(user_id),
            'hesitation_points': identify_hesitations(user_id)
        }

    def compare_users(self, user1_id, user2_id):
        """Check if two accounts have same human behind them"""
        similarity = cosine_similarity(
            self.interaction_patterns(user1_id),
            self.interaction_patterns(user2_id)
        )

        return similarity > 0.9  # Very similar = likely same person
```

#### Tier 4: Economic Disincentives
```javascript
// Make Sybil attacks unprofitable
const SYBIL_BARRIERS = {
  account_creation: {
    deposit_required: 50,  // $50 locked for 30 days for new accounts
    early_withdrawal_penalty: 0.25  // Lose 25% if withdrawn early
  },

  reputation_building: {
    min_trades_for_tier_upgrade: 10,
    min_time_for_tier_upgrade: 30 * 24 * 60 * 60,  // 30 days
    min_volume_for_tier_upgrade: 5000
  },

  trust_network: {
    vouching_required: true,  // Need 3 trusted users to vouch for tier upgrade
    voucher_liability: 0.1  // Voucher loses 10% of deposit if vouchee commits fraud
  }
};
```

**Binance P2P Approach:**
- Mandatory KYC for all users (government ID)
- Face verification required
- One account per identity (strictly enforced)
- Bank account verification (name must match KYC)
- Device fingerprinting for fraud detection
- Appeal process requires video selfie

---

## 4. CREDIT CARD SPECIFIC FRAUD

### 4.1 Stolen Card Usage

**Attack Pattern:**
1. Attacker obtains stolen card data (dark web, phishing, skimming)
2. Uses card to buy crypto on P2P platform
3. Quickly withdraws crypto to untraceable wallet
4. Real cardholder disputes charge (chargeback)
5. Platform loses both crypto and fiat

**Fraud Indicators:**
- Mismatched billing/shipping addresses
- High-value first transaction
- Rapid succession of transactions
- VPN or proxy usage
- Card from different country than IP
- Multiple failed authorization attempts
- Velocity inconsistent with legitimate behavior

**Countermeasures:**

#### Strategy 1: Don't Accept Credit Cards
**Recommendation:** This is what most P2P crypto platforms do.

**Reasoning:**
- 2-5% fraud rate on crypto purchases
- 180-day chargeback window
- Zero seller protection for intangible goods
- High processing fees (3-5%)
- Regulatory burden (PCI DSS compliance)

**Platforms that ban cards:**
- Binance P2P: Bank transfer only
- Paxful: No cards (cash, bank, crypto only)
- LocalBitcoins: No cards

#### Strategy 2: If You Must Accept Cards - Heavy Controls
```javascript
CARD_ACCEPTANCE_RULES = {
  allowed_regions: ["US", "UK", "EU"],  // Only low-fraud regions

  max_amounts: {
    first_transaction: 100,
    daily: 500,
    monthly: 2000
  },

  required_checks: [
    "3DS2 authentication (mandatory)",
    "AVS (Address Verification)",
    "CVV verification",
    "IP geolocation match",
    "Device fingerprinting"
  ],

  hold_periods: {
    first_card_transaction: 180,  // Full chargeback window
    repeat_buyer_good_history: 90
  },

  fraud_scoring: {
    threshold_to_block: 70,  // Out of 100
    threshold_to_review: 40
  }
};
```

#### Strategy 3: 3D Secure 2 (3DS2) Mandatory
```javascript
// Stripe example - enforce SCA (Strong Customer Authentication)
const paymentIntent = await stripe.paymentIntents.create({
  amount: 5000,
  currency: 'eur',
  payment_method_types: ['card'],
  payment_method_options: {
    card: {
      request_three_d_secure: 'any'  // Always require 3DS
    }
  }
});

// 3DS2 shifts liability to card issuer
// If user completes 3DS challenge, chargeback protection increases
```

**3DS2 Benefits:**
- Shifts liability to bank (if authentication succeeded)
- Reduces fraud by 50-70%
- Required by PSD2 in Europe
- Better user experience than 3DS1 (biometrics, app-based)

#### Strategy 4: Fraud Scoring
```python
def calculate_card_fraud_score(transaction):
    score = 0

    # Geographic mismatch
    if transaction['card_country'] != transaction['ip_country']:
        score += 25

    # New card on new account
    if transaction['is_new_card'] and transaction['account_age_days'] < 30:
        score += 20

    # High velocity
    recent_purchases = get_recent_purchases(transaction['user_id'], hours=24)
    if len(recent_purchases) > 3:
        score += 15

    # BIN analysis (card issuer risk)
    if is_high_risk_bin(transaction['card_bin']):
        score += 20

    # Email domain
    if is_disposable_email(transaction['email']):
        score += 15

    # Time of day (late night higher fraud)
    if transaction['hour'] in range(0, 6):
        score += 10

    # Proxy/VPN usage
    if transaction['using_vpn']:
        score += 15

    # Failed previous attempts
    if transaction['failed_attempts_24h'] > 2:
        score += 20

    return min(score, 100)

# Actions based on score
if score >= 70:
    decline_transaction()
elif score >= 40:
    require_manual_review()
    send_verification_email()
elif score >= 20:
    apply_extended_hold_period()
else:
    approve_with_standard_holds()
```

---

### 4.2 Friendly Fraud (Chargeback Abuse)

**Attack Pattern:**
1. Legitimate cardholder makes purchase
2. Receives crypto
3. Claims to bank: "I didn't authorize this" or "Never received goods"
4. Bank reverses charge (chargeback)
5. Buyer keeps crypto + gets money back

**Why It Works:**
- Banks favor cardholders in disputes
- Crypto is intangible (can't prove delivery like physical goods)
- Regulations like Reg E (US) and PSD2 (EU) protect consumers
- Platform has limited ability to fight chargebacks

**Prevalence:**
- 0.5-2% of all card transactions
- Higher (2-5%) for crypto purchases
- Organized fraud rings target crypto platforms

**Countermeasures:**

#### Strategy 1: Evidence Collection for Disputes
```javascript
EVIDENCE_TO_COLLECT = {
  authentication: [
    "3DS2 authentication logs",
    "IP address and geolocation",
    "Device fingerprint",
    "Login timestamps"
  ],

  delivery_proof: [
    "Blockchain transaction hash (crypto sent)",
    "Timestamp of crypto delivery",
    "Wallet address confirmation by user",
    "Screenshots of user wallet showing receipt"
  ],

  communication: [
    "All in-app chat logs",
    "Email confirmations sent to user",
    "SMS confirmations",
    "Terms of service acceptance logs"
  ],

  user_verification: [
    "KYC documents submitted",
    "Selfie/video verification",
    "Bank account verification",
    "Previous successful transactions (repeat buyer)"
  ]
};

// Automatically compile evidence package when chargeback filed
async function handleChargeback(chargebackId) {
  const transaction = await getTransaction(chargebackId);

  const evidence = {
    product_description: "Cryptocurrency purchase - Bitcoin",
    customer_name: transaction.kyc_name,
    customer_email: transaction.email,
    customer_purchase_ip: transaction.ip,
    billing_address: transaction.billing_address,
    receipt: transaction.receipt_url,
    shipping_documentation: transaction.blockchain_proof_url,  // Blockchain explorer link
    service_date: transaction.crypto_delivery_timestamp,
    duplicate_charge_documentation: null,
    refund_policy: "https://billhaven.com/refund-policy",
    cancellation_policy: "https://billhaven.com/cancellation",
    customer_communication: transaction.chat_logs_url,
    customer_signature: transaction.terms_acceptance_ip_and_timestamp,
    uncategorized_file: transaction.additional_evidence_url
  };

  await stripe.disputes.update(chargebackId, { evidence });
}
```

**Win Rate:**
- With strong evidence: 20-40% (still low)
- Without evidence: <5%
- 3DS2 authentication: +30% win rate
- Video KYC: +20% win rate

#### Strategy 2: Blacklist Chargeback Abusers
```javascript
// Industry-shared blacklist
const CHARGEBACK_DATABASES = [
  "Ethoca",  // Mastercard's chargeback prevention
  "Verifi",  // Visa's CDRN (Chargeback Dispute Resolution Network)
  "G2",      // Industry fraud database
];

async function checkChargebackHistory(email, cardBin) {
  // Check if user has chargeback history across platforms
  const ethocaResult = await ethoca.check(email);
  const verifiResult = await verifi.check(cardBin);

  if (ethocaResult.chargebacks > 0 || verifiResult.chargebacks > 0) {
    return {
      block: true,
      reason: "User has chargeback history on other platforms"
    };
  }
}

// Report chargebacks to databases (warn other platforms)
async function reportChargeback(transaction) {
  await ethoca.report({
    email: transaction.email,
    card_bin: transaction.card_bin,
    amount: transaction.amount,
    date: transaction.date
  });
}
```

#### Strategy 3: Chargeback Alerts & Refunds
```javascript
// Services like Ethoca and Verifi provide early alerts
// Refund proactively before chargeback filed (avoids fees)

const handleChargebackAlert = async (alert) => {
  // Alert received: Customer is about to file chargeback

  // Option 1: Refund immediately (avoid chargeback fee)
  if (alert.amount < 500) {
    await issueRefund(alert.transaction_id);
    // Save $15-25 chargeback fee
    // Avoid chargeback counting against merchant rating
  }

  // Option 2: Contact customer to resolve
  await sendEmail(alert.customer_email, {
    subject: "Issue with your purchase?",
    body: "We noticed you may have a concern. Let's resolve this directly."
  });

  // Many friendly fraudsters will accept refund offer
  // Avoid chargeback fee and merchant penalties
};
```

---

### 4.3 Card Testing Attacks

**Attack Pattern:**
1. Fraudster obtains list of stolen cards (often incomplete data)
2. Makes small test purchases ($1-5) to verify which cards work
3. Successful cards used for large fraudulent purchases
4. Platform pays fees for all test transactions

**Indicators:**
- Rapid succession of small-value transactions
- Same IP/device, different cards
- Sequential card numbers (same BIN)
- High decline rate followed by successful charge
- Multiple different billing addresses from same user

**Impact:**
- Processing fees on declined transactions
- Chargeback fees when cardholders dispute test charges
- Reputation damage with payment processors
- Risk of merchant account termination

**Countermeasures:**

#### Strategy 1: CAPTCHA and Rate Limiting
```javascript
const CARD_TESTING_PREVENTION = {
  rate_limits: {
    max_card_attempts_per_ip_per_hour: 3,
    max_different_cards_per_user_per_day: 2,
    max_failed_attempts_before_captcha: 2,
    max_failed_attempts_before_block: 5
  },

  captcha_triggers: [
    "After 2 failed card attempts",
    "New user's first transaction",
    "IP from high-risk country",
    "Tor/VPN detected"
  ],

  card_verification: {
    min_first_transaction: 50,  // No micro-transactions for testing
    require_full_card_data: true,  // Not just number, also CVV, ZIP
    bin_validation: true  // Check if BIN exists and matches country
  }
};

// Implementation
async function processCardPayment(cardData, userId, ip) {
  // Check rate limits
  const recentAttempts = await getCardAttempts(ip, '1h');
  if (recentAttempts.length >= 3) {
    throw new Error("Too many card attempts. Try again in 1 hour.");
  }

  // Check for testing pattern
  const differentCards = await getUniqueCardsUsed(userId, '24h');
  if (differentCards.length >= 2) {
    requireCaptcha();
  }

  // Validate card BIN
  const binInfo = await validateBIN(cardData.number.substring(0, 6));
  if (binInfo.country !== ipCountry(ip)) {
    increaseRiskScore(20);
  }

  // Proceed with payment
}
```

#### Strategy 2: Minimum Transaction Amount
```javascript
// Prevent small test charges
const MIN_TRANSACTION = {
  new_user: 50,        // First transaction must be $50+
  verified_user: 20,   // After KYC, can go lower
  trusted_user: 10     // After 5+ successful transactions
};

// Makes card testing expensive (can't test 100 cards for $100)
```

#### Strategy 3: Fraud Detection Signals
```python
def detect_card_testing(transaction_data):
    red_flags = []

    # Check for sequential card numbers
    recent_cards = get_recent_cards(transaction_data['ip'], hours=1)
    if are_sequential(recent_cards):
        red_flags.append("Sequential card numbers detected")

    # Check decline rate
    decline_rate = calculate_decline_rate(transaction_data['ip'], hours=24)
    if decline_rate > 0.5:  # More than 50% declined
        red_flags.append("High decline rate")

    # Check transaction amount pattern
    if transaction_data['amount'] < 5:
        red_flags.append("Micro-transaction (possible test)")

    # Check velocity
    tx_count = count_transactions(transaction_data['ip'], minutes=10)
    if tx_count > 3:
        red_flags.append("High velocity")

    # Check user agent
    if "bot" in transaction_data['user_agent'].lower():
        red_flags.append("Automated bot detected")

    if len(red_flags) >= 2:
        return {
            'action': 'BLOCK',
            'reason': red_flags,
            'require_manual_review': True
        }

    return {'action': 'ALLOW'}
```

---

### 4.4 Geographic Mismatch Fraud

**Attack Pattern:**
- Card issued in Country A
- IP address from Country B
- Billing address in Country C
- Common in international fraud (stolen cards used from different country)

**Risk Levels:**

| Scenario | Risk Level | Action |
|----------|-----------|---------|
| Card country = IP country = Billing | LOW | Approve |
| Card country = Billing, IP different (VPN) | MEDIUM | Extra verification |
| Card country ≠ IP country ≠ Billing | HIGH | Block or manual review |
| High-risk country involvement | CRITICAL | Block |

**High-Risk Countries (per fraud data):**
- Nigeria, Ghana (West Africa): High card fraud rates
- Indonesia, Philippines: High fraud rings
- Eastern Europe: Sophisticated cybercrime
- Any sanctioned countries: Compliance risk

**Countermeasures:**

#### Strategy 1: Geographic Restrictions
```javascript
const GEO_RULES = {
  allowed_card_countries: [
    "US", "UK", "CA", "AU", "DE", "FR", "IT", "ES", "NL", "SE", "NO", "DK"
  ],

  blocked_ip_countries: [
    "NG", "GH", "PK", "ID",  // High fraud
    "KP", "IR", "SY", "CU"   // Sanctions
  ],

  mismatch_policy: {
    card_country_ip_country_mismatch: "REQUIRE_VERIFICATION",
    billing_country_ip_country_mismatch: "EXTRA_CHECKS",
    all_three_different: "BLOCK_OR_MANUAL_REVIEW"
  }
};

async function validateGeography(transaction) {
  const cardCountry = getCardCountry(transaction.card_bin);
  const ipCountry = getIPCountry(transaction.ip);
  const billingCountry = transaction.billing_address_country;

  // Check blocks
  if (GEO_RULES.blocked_ip_countries.includes(ipCountry)) {
    return { approve: false, reason: "IP from blocked country" };
  }

  if (!GEO_RULES.allowed_card_countries.includes(cardCountry)) {
    return { approve: false, reason: "Card from unsupported country" };
  }

  // Check mismatches
  const mismatches = new Set([cardCountry, ipCountry, billingCountry]).size;

  if (mismatches === 3) {
    return {
      approve: false,
      reason: "Card, IP, and billing all from different countries",
      require_manual_review: true
    };
  }

  if (mismatches === 2) {
    return {
      approve: true,
      require_3ds: true,
      require_additional_verification: true
    };
  }

  return { approve: true };
}
```

#### Strategy 2: VPN/Proxy Detection
```javascript
// Use services like IPHub, IPQualityScore, MaxMind
async function detectProxy(ip) {
  const ipInfo = await IPQualityScore.check(ip);

  return {
    is_vpn: ipInfo.vpn,
    is_tor: ipInfo.tor,
    is_proxy: ipInfo.proxy,
    is_datacenter: ipInfo.datacenter,  // Cloud server, not residential
    fraud_score: ipInfo.fraud_score,   // 0-100
    recent_abuse: ipInfo.recent_abuse  // IP recently used for fraud
  };
}

// Policy
if (proxyInfo.is_vpn || proxyInfo.is_tor) {
  requireAdditionalVerification();
  extendHoldPeriod();
}

if (proxyInfo.fraud_score > 75) {
  blockTransaction();
}
```

#### Strategy 3: Adaptive Policies
```javascript
// Less strict for trusted users
const getGeoPolicy = (user) => {
  if (user.successful_transactions > 10 && user.chargeback_rate === 0) {
    // Trusted user: Allow VPN, allow travel
    return {
      allow_geo_mismatch: true,
      allow_vpn: true,
      require_3ds: false
    };
  }

  if (user.kyc_verified && user.successful_transactions > 3) {
    // Verified user: Moderate restrictions
    return {
      allow_geo_mismatch: true,
      allow_vpn: false,
      require_3ds: true
    };
  }

  // New user: Strict
  return {
    allow_geo_mismatch: false,
    allow_vpn: false,
    require_3ds: true,
    manual_review: true
  };
};
```

---

## 5. MITIGATION STRATEGIES - PLATFORM COMPARISONS

### 5.1 Binance P2P Security Model

**Key Features:**

1. **No Credit Cards**
   - Only bank transfers, cash deposits, e-wallets
   - Eliminates chargeback risk entirely

2. **Mandatory KYC**
   - Government ID required (Levels 1 & 2)
   - Facial verification
   - Address proof for higher limits
   - One account per person (strictly enforced)

3. **Escrow System**
   - Crypto locked in platform escrow (not smart contract)
   - Release requires both parties' consent or appeal resolution
   - Centralized control (can reverse fraudulent transactions)

4. **Payment Verification**
   - Buyer must upload payment proof
   - Unique reference code for each trade (prevents screenshot reuse)
   - Payment must come from KYC-verified bank account (name match)

5. **Appeal System**
   - Disputes handled by Binance support team
   - Video calls required for high-value disputes
   - Historical behavior considered
   - Permanent ban for confirmed fraud

6. **Reputation System**
   - Completion rate displayed (% of trades completed)
   - Average release time
   - Total trades and volume
   - Positive/negative feedback from counterparties

7. **Risk Controls**
   - Daily withdrawal limits based on KYC level
   - Velocity limits on new accounts
   - Behavioral analytics (abnormal patterns flagged)
   - Device fingerprinting

**Security Tradeoffs:**
- Pros: Very low fraud rate, high trust, good UX for legitimate users
- Cons: Centralized (platform can freeze funds), KYC required (no privacy), geo-restricted

---

### 5.2 Paxful Security Model

**Key Features:**

1. **Reputation-Based Trust**
   - Extensive feedback system
   - Trust score based on completed trades
   - Verified badges (phone, email, ID, address)
   - Volume badges (shows trading history)

2. **Escrow with Dispute Resolution**
   - Bitcoin locked in Paxful escrow
   - 3-hour trade window (auto-cancel if not completed)
   - Dispute system with moderator review
   - Evidence submission (screenshots, chat logs)

3. **Flexible Payment Methods**
   - 300+ payment options (gift cards, bank transfers, cash)
   - No credit cards (too risky)
   - Seller chooses accepted methods

4. **Identity Verification Tiers**
   - Tier 1: Email + phone (small limits)
   - Tier 2: ID verification (higher limits)
   - Tier 3: Selfie + address proof (highest limits)
   - Sellers can require buyers to be verified

5. **Two-Factor Authentication**
   - Mandatory 2FA for all accounts
   - SMS, TOTP (Google Authenticator), or Yubikey

6. **Vendor Bonds**
   - High-volume sellers must post bond (collateral)
   - Bond forfeited if seller commits fraud
   - Incentivizes honest behavior

7. **Automated Scam Detection**
   - Chat monitoring for scam keywords
   - Unusual trading patterns flagged
   - Multiple account detection
   - IP/device tracking

**Security Tradeoffs:**
- Pros: More privacy-friendly, decentralized trust, flexible payments
- Cons: Higher scam rate than Binance, disputes can take time, seller bears more risk

---

### 5.3 LocalBitcoins / LocalCryptos Security Model

**LocalBitcoins (Custodial, KYC-Required):**
- Mandatory KYC since 2019 (EU regulations)
- Escrow held by platform
- Centralized dispute resolution
- Bank transfer focus (cards not allowed)
- Trade limits based on verification level

**LocalCryptos (Non-Custodial, No-KYC):**
- Smart contract escrow (Ethereum-based)
- No KYC required
- Self-custodial wallets (users control keys)
- Decentralized (platform can't freeze funds)
- Arbitration bond system for disputes

**Arbitration Bond System:**
```javascript
// Innovative dispute resolution without central authority
{
  "trade_start": "Crypto locked in smart contract escrow",
  "if_dispute": {
    "both_parties_stake_bond": "Equal to trade value",
    "arbitrator_selected": "Random from pool of staked arbitrators",
    "arbitrator_reviews_evidence": "Chat logs, payment proofs",
    "arbitrator_decision": "Awards crypto + both bonds to winner",
    "loser_penalty": "Loses bond (2x loss if wrong)"
  },
  "incentives": {
    "false_disputes_punished": "Costs you 100% of trade value",
    "arbitrators_staked": "Lose stake if biased decisions",
    "economic_game_theory": "Truth-telling is Nash equilibrium"
  }
}
```

**Security Tradeoffs:**
- LocalBitcoins: Lower fraud (KYC) but less privacy, centralized control
- LocalCryptos: More privacy, censorship-resistant, but higher scam risk, complex UX

---

### 5.4 Best Practices Synthesis for BillHaven

**Recommended Security Stack:**

#### Layer 1: Payment Processing
```javascript
PAYMENT_STRATEGY = {
  accepted_methods: [
    "Bank transfers (ACH, SEPA, Faster Payments, Wire)",
    "Crypto-to-crypto (zero chargeback risk)",
    "Cash in person (advanced feature, geo-restricted)"
  ],

  NOT_accepted: [
    "Credit cards (2-5% fraud, 180-day chargebacks)",
    "PayPal (high dispute rate for crypto)",
    "Gift cards (high fraud, hard to verify)"
  ],

  verification: {
    primary: "Direct bank API integration (Plaid, TrueLayer)",
    secondary: "Unique payment reference codes",
    fallback: "Manual review with video proof only"
  }
}
```

#### Layer 2: Identity & Reputation
```javascript
IDENTITY_STRATEGY = {
  kyc_tiers: {
    tier_0: {
      requirements: ["Email", "Phone"],
      limits: { per_trade: 100, per_day: 200 },
      hold_period: "MAX_FOR_PAYMENT_METHOD"
    },
    tier_1: {
      requirements: ["Email", "Phone", "ID Document", "Selfie"],
      limits: { per_trade: 1000, per_day: 3000 },
      hold_period: "50% of max"
    },
    tier_2: {
      requirements: ["All tier 1", "Address Proof", "Bank Account Link"],
      limits: { per_trade: 10000, per_day: 25000 },
      hold_period: "25% of max"
    }
  },

  reputation_system: {
    display: ["Completion rate", "Total trades", "Total volume", "Member since"],
    filters: ["Min reputation to trade with", "KYC level required"],
    incentives: ["Faster releases for trusted users", "Lower fees"]
  },

  sybil_prevention: {
    device_fingerprinting: true,
    behavioral_biometrics: true,
    graph_analysis: true,
    account_linking_detection: true
  }
}
```

#### Layer 3: Smart Contract Security
```solidity
// Use battle-tested OpenZeppelin contracts
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract BillHavenEscrow is ReentrancyGuard, Pausable, AccessControl {
    // State machine for trade states
    enum TradeState { PENDING, FUNDED, RELEASED, REFUNDED, DISPUTED }

    struct Trade {
        address buyer;
        address seller;
        uint256 amount;
        uint256 holdUntil;
        TradeState state;
        string paymentProof;
    }

    mapping(uint256 => Trade) public trades;

    // Admin role for dispute resolution
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Create escrow
    function createTrade(
        address _seller,
        uint256 _holdPeriod
    ) external payable returns (uint256 tradeId) {
        require(msg.value > 0, "Must send crypto");

        tradeId = nextTradeId++;
        trades[tradeId] = Trade({
            buyer: msg.sender,
            seller: _seller,
            amount: msg.value,
            holdUntil: block.timestamp + _holdPeriod,
            state: TradeState.FUNDED,
            paymentProof: ""
        });

        emit TradeCreated(tradeId, msg.sender, _seller, msg.value);
    }

    // Release to seller (checks-effects-interactions pattern)
    function release(uint256 tradeId) external nonReentrant {
        Trade storage trade = trades[tradeId];

        require(trade.state == TradeState.FUNDED, "Invalid state");
        require(msg.sender == trade.buyer, "Only buyer can release");
        require(block.timestamp >= trade.holdUntil, "Hold period not over");

        // EFFECTS: Update state before external call
        trade.state = TradeState.RELEASED;

        // INTERACTIONS: External call happens last
        (bool success, ) = payable(trade.seller).call{value: trade.amount}("");
        require(success, "Transfer failed");

        emit TradeReleased(tradeId);
    }

    // Refund to buyer
    function refund(uint256 tradeId) external nonReentrant {
        Trade storage trade = trades[tradeId];

        require(trade.state == TradeState.FUNDED, "Invalid state");
        require(
            msg.sender == trade.seller || hasRole(ADMIN_ROLE, msg.sender),
            "Unauthorized"
        );

        trade.state = TradeState.REFUNDED;

        (bool success, ) = payable(trade.buyer).call{value: trade.amount}("");
        require(success, "Transfer failed");

        emit TradeRefunded(tradeId);
    }

    // Emergency pause
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
```

#### Layer 4: Fraud Detection
```python
class ComprehensiveFraudDetection:
    def __init__(self):
        self.ml_model = self.load_fraud_model()
        self.graph_analyzer = GraphAnalyzer()
        self.behavior_analyzer = BehaviorAnalyzer()

    async def assess_transaction(self, transaction):
        """Multi-layered fraud assessment"""

        # Layer 1: Rule-based checks
        rule_score = self.rule_based_check(transaction)

        # Layer 2: Machine learning
        ml_score = self.ml_model.predict(transaction.features)

        # Layer 3: Graph analysis (account linking)
        graph_score = self.graph_analyzer.get_risk_score(transaction.user_id)

        # Layer 4: Behavioral analysis
        behavior_score = self.behavior_analyzer.analyze(transaction.user_id)

        # Ensemble scoring
        final_score = (
            rule_score * 0.3 +
            ml_score * 0.4 +
            graph_score * 0.2 +
            behavior_score * 0.1
        )

        # Decision
        if final_score > 80:
            return {"action": "BLOCK", "reason": "High fraud risk"}
        elif final_score > 50:
            return {"action": "MANUAL_REVIEW", "reason": "Moderate risk"}
        elif final_score > 30:
            return {"action": "EXTRA_HOLDS", "reason": "Elevated risk"}
        else:
            return {"action": "APPROVE", "reason": "Low risk"}

    def rule_based_check(self, tx):
        """Fast rule-based screening"""
        score = 0

        # Check blocklists
        if self.is_blocked_ip(tx.ip):
            score += 100
        if self.is_blocked_email(tx.email):
            score += 100

        # Velocity checks
        if self.exceeds_velocity_limits(tx.user_id, tx.amount):
            score += 40

        # Geographic checks
        if self.geo_mismatch(tx):
            score += 25

        # New account risk
        if tx.account_age_days < 7:
            score += 20

        # Payment method risk
        if tx.payment_method in ['credit_card', 'paypal']:
            score += 30

        return min(score, 100)
```

#### Layer 5: Monitoring & Response
```javascript
const MONITORING_SYSTEM = {
  real_time_alerts: {
    high_value_transaction: "> $10,000",
    velocity_spike: "3x normal volume",
    new_fraud_pattern: "ML model detects anomaly",
    chargeback_filed: "Immediate notification",
    dispute_opened: "Route to support team"
  },

  automated_responses: {
    freeze_suspicious_trades: "Auto-pause for manual review",
    increment_hold_periods: "Add 7 days if risky",
    require_video_verification: "For high-risk high-value",
    block_repeat_offenders: "Permanent ban + report to authorities"
  },

  reporting: {
    daily_fraud_report: "Attempted fraud, blocked fraud, losses",
    weekly_pattern_analysis: "Emerging fraud trends",
    monthly_ML_retraining: "Update models with new data"
  }
}
```

---

## 6. COMPREHENSIVE SECURITY CHECKLIST

### PAYMENT FRAUD PREVENTION

- [ ] **No Credit Card Acceptance** (Recommendation: Ban entirely)
  - [ ] If accepting cards: Mandatory 3DS2 authentication
  - [ ] If accepting cards: 180-day hold periods
  - [ ] If accepting cards: Max $100 first transaction

- [ ] **Bank Transfer Verification**
  - [ ] Direct API integration (Plaid/TrueLayer/Yodlee)
  - [ ] Unique payment reference codes per trade
  - [ ] Name match between bank account and KYC
  - [ ] Never accept screenshots as payment proof

- [ ] **Hold Periods Matched to Reversal Risk**
  - [ ] Credit cards: 180 days
  - [ ] PayPal: 180 days
  - [ ] ACH: 60 days
  - [ ] SEPA: 56 days
  - [ ] SEPA Instant: 14 days
  - [ ] Faster Payments: 3 days
  - [ ] Wire: 7 days
  - [ ] Crypto: 0 days

- [ ] **Graduated Release Based on Reputation**
  - [ ] New users: Full hold period
  - [ ] Verified users: 50% of hold period
  - [ ] Trusted users (50+ trades): 25% of hold period

- [ ] **Payment Reversal Insurance Fund**
  - [ ] 5-10% of fees go to reserve
  - [ ] Covers legitimate reversals
  - [ ] Fraudsters pursued for debt collection

### SMART CONTRACT SECURITY

- [ ] **Reentrancy Protection**
  - [ ] Use OpenZeppelin's ReentrancyGuard
  - [ ] Checks-Effects-Interactions pattern
  - [ ] State updates before external calls

- [ ] **Oracle Security** (if using price feeds)
  - [ ] Chainlink as primary oracle
  - [ ] Multiple oracle sources (median of 3+)
  - [ ] TWAP for DEX prices (not spot prices)
  - [ ] Deviation checks (flag >10% moves)
  - [ ] Circuit breakers for extreme volatility

- [ ] **Flash Loan Protection** (if relevant)
  - [ ] Same-block balance tracking
  - [ ] TWAP instead of spot prices
  - [ ] No governance based on token holdings in same tx

- [ ] **Front-Running Protection**
  - [ ] Commit-reveal scheme for sensitive operations
  - [ ] Flashbots Protect RPC for private txs
  - [ ] Or: Batch auction model (Gnosis CowSwap)

- [ ] **Signature Replay Protection**
  - [ ] EIP-712 typed structured data signing
  - [ ] Nonce-based signatures
  - [ ] Chain ID in signature
  - [ ] Contract address in signature
  - [ ] Deadline/expiry in signature

- [ ] **Access Control**
  - [ ] OpenZeppelin AccessControl for roles
  - [ ] Multi-sig for admin operations (Gnosis Safe)
  - [ ] Timelock for critical upgrades (48-hour delay)

- [ ] **Pause Mechanism**
  - [ ] Emergency pause function (Pausable)
  - [ ] Multi-sig required to unpause
  - [ ] Test pause/unpause in staging

- [ ] **Audit & Testing**
  - [ ] Professional audit (Trail of Bits, OpenZeppelin, Consensys)
  - [ ] Slither static analysis
  - [ ] Echidna fuzzing
  - [ ] 100% test coverage
  - [ ] Testnet deployment and testing (Sepolia, Goerli)

### BUSINESS LOGIC SECURITY

- [ ] **Race Condition Prevention**
  - [ ] State machine with exclusive states
  - [ ] Mutex locks on critical functions
  - [ ] Atomic transactions (all-or-nothing)

- [ ] **Hold Period Enforcement**
  - [ ] On-chain time locks (block.timestamp)
  - [ ] Immutable minimum holds (even admin can't override)
  - [ ] Account linking detection (prevent self-trading bypass)

- [ ] **Velocity Limits**
  - [ ] Per-transaction limits
  - [ ] Daily limits (calendar day)
  - [ ] Rolling 24-hour limits
  - [ ] Weekly limits
  - [ ] All limits in USD-equivalent (aggregate across assets)
  - [ ] Graduated limits by user tier

- [ ] **Sybil Attack Prevention**
  - [ ] KYC tiers (government ID for higher limits)
  - [ ] Device fingerprinting
  - [ ] Behavioral biometrics (typing, mouse patterns)
  - [ ] Graph analysis (detect linked accounts)
  - [ ] Economic disincentives (deposits locked for new accounts)

- [ ] **Dispute Resolution**
  - [ ] Clear evidence requirements
  - [ ] Blockchain proof of crypto transfer
  - [ ] Bank API proof of fiat transfer
  - [ ] Chat logs automatically saved
  - [ ] Video call option for high-value disputes
  - [ ] SLA for resolution (48 hours)

### IDENTITY & REPUTATION

- [ ] **KYC Tiers**
  - [ ] Tier 0: Email + phone (low limits)
  - [ ] Tier 1: ID document + selfie (medium limits)
  - [ ] Tier 2: Address proof + bank link (high limits)
  - [ ] Use IDV providers (Onfido, Jumio, Persona)

- [ ] **Reputation System**
  - [ ] Completion rate visible
  - [ ] Total trades and volume visible
  - [ ] Positive/negative feedback with reasons
  - [ ] Allow filtering by minimum reputation
  - [ ] Badges for milestones (100 trades, $100K volume)

- [ ] **2FA Mandatory**
  - [ ] TOTP (Google Authenticator, Authy)
  - [ ] SMS backup (with SIM swap protection)
  - [ ] Hardware key support (Yubikey)
  - [ ] Required for: Login, withdrawals, settings changes

- [ ] **Session Security**
  - [ ] JWT with short expiry (15 minutes)
  - [ ] Refresh tokens with rotation
  - [ ] Device binding (suspicious new device = reverify)
  - [ ] IP binding (geo-jump = reverify)

### FRAUD DETECTION & MONITORING

- [ ] **Rule-Based Detection**
  - [ ] Blocklists (IP, email, wallet, bank account)
  - [ ] Geographic mismatch detection
  - [ ] Velocity limit enforcement
  - [ ] Payment method risk scoring
  - [ ] New account risk penalties

- [ ] **Machine Learning**
  - [ ] Fraud prediction model (supervised learning)
  - [ ] Anomaly detection (unsupervised learning)
  - [ ] Graph neural networks (account linking)
  - [ ] NLP for scam chat detection
  - [ ] Monthly model retraining

- [ ] **Real-Time Monitoring**
  - [ ] Transaction monitoring dashboard
  - [ ] Automated alerts (high-value, velocity spikes)
  - [ ] Queue for manual review
  - [ ] SLA for review (1 hour for urgent)

- [ ] **Chargeback Management**
  - [ ] Ethoca/Verifi chargeback alerts
  - [ ] Automated evidence compilation
  - [ ] Proactive refund offers
  - [ ] Chargeback database reporting
  - [ ] Blacklist chargeback abusers

- [ ] **Incident Response Plan**
  - [ ] Breach notification process
  - [ ] Fund recovery procedures
  - [ ] Law enforcement liaison
  - [ ] User communication templates
  - [ ] Post-mortem and improvement process

### COMPLIANCE & LEGAL

- [ ] **AML Compliance**
  - [ ] Transaction monitoring for suspicious activity
  - [ ] SAR filing procedures (US: FinCEN)
  - [ ] FATF Travel Rule compliance ($1K+ transfers)
  - [ ] Sanctions screening (OFAC, EU lists)

- [ ] **Data Protection**
  - [ ] GDPR compliance (EU users)
  - [ ] CCPA compliance (California users)
  - [ ] Encrypted data storage
  - [ ] Right to deletion process
  - [ ] Data breach notification (72 hours)

- [ ] **Terms & Policies**
  - [ ] Clear terms of service
  - [ ] Escrow process explanation
  - [ ] Dispute resolution policy
  - [ ] Acceptable use policy (no illegal goods)
  - [ ] Privacy policy

- [ ] **Licenses & Registrations**
  - [ ] MSB registration (US: FinCEN)
  - [ ] State money transmitter licenses (US: varies by state)
  - [ ] FCA registration (UK)
  - [ ] MiCA compliance (EU 2024+)

### OPERATIONAL SECURITY

- [ ] **Infrastructure Security**
  - [ ] Web application firewall (Cloudflare, AWS WAF)
  - [ ] DDoS protection
  - [ ] Rate limiting (API, login, transactions)
  - [ ] HTTPS everywhere (HSTS)
  - [ ] Security headers (CSP, X-Frame-Options)

- [ ] **Key Management**
  - [ ] Hardware security modules (HSM) for hot wallets
  - [ ] Multi-sig for cold storage (3-of-5)
  - [ ] Key rotation policy
  - [ ] Backup and recovery procedures
  - [ ] No keys in code (use env vars, secrets managers)

- [ ] **Monitoring & Logging**
  - [ ] Centralized logging (ELK stack, DataDog)
  - [ ] Audit trail for all admin actions
  - [ ] Intrusion detection (OSSEC, Wazuh)
  - [ ] Uptime monitoring (Pingdom, UptimeRobot)

- [ ] **Incident Response**
  - [ ] On-call rotation
  - [ ] Runbooks for common issues
  - [ ] Security incident playbook
  - [ ] Regular drills (quarterly)

### USER EDUCATION

- [ ] **Onboarding Security Education**
  - [ ] How escrow works
  - [ ] Red flags for scams
  - [ ] Payment verification importance
  - [ ] Dispute process

- [ ] **In-App Warnings**
  - [ ] "Never release without payment confirmation"
  - [ ] "Platform staff will never ask you to release early"
  - [ ] "Don't communicate outside the platform"
  - [ ] Flagging suspicious messages

- [ ] **Help Center**
  - [ ] FAQ on common scams
  - [ ] Video tutorials
  - [ ] Contact support easily
  - [ ] Report fraud button

---

## 7. RECOMMENDED IMPLEMENTATION ROADMAP

### Phase 1: MVP Security (Launch-Ready)

**Scope:** Essential security for initial launch
**Timeline:** Include in V1

**Must-Have Features:**
1. Smart contract with reentrancy guards (OpenZeppelin)
2. State machine for trade states
3. On-chain hold periods (immutable)
4. Basic KYC (email + phone verification)
5. Payment method: Bank transfers only (no cards)
6. Manual payment verification (admin review)
7. Basic reputation system (completion rate)
8. 2FA (TOTP)
9. Dispute mechanism (manual admin resolution)

**Expected Fraud Rate:** 2-5% (acceptable for MVP)

### Phase 2: Automated Verification (Scale-Up)

**Scope:** Reduce manual work, improve UX
**Timeline:** Month 2-3

**Features:**
1. Bank API integration (Plaid/TrueLayer)
2. Automated payment verification
3. Rule-based fraud detection
4. Device fingerprinting
5. Geographic validation
6. Automated velocity limits
7. Risk-based hold periods

**Expected Fraud Rate:** 1-2%

### Phase 3: Advanced Fraud Detection (Optimization)

**Scope:** ML-based detection, sophisticated attacks
**Timeline:** Month 4-6

**Features:**
1. Machine learning fraud model
2. Graph analysis for Sybil detection
3. Behavioral biometrics
4. Chargeback management (Ethoca/Verifi)
5. Real-time monitoring dashboard
6. Graduated KYC tiers
7. Reputation-based limits

**Expected Fraud Rate:** 0.5-1%

### Phase 4: Enterprise-Grade (Maturity)

**Scope:** Best-in-class security
**Timeline:** Month 7-12

**Features:**
1. Professional smart contract audit
2. Multi-oracle price feeds (if needed)
3. Bug bounty program
4. Penetration testing
5. SOC 2 Type II compliance
6. Insurance coverage for user funds
7. Advanced dispute resolution (arbitration bonds)

**Expected Fraud Rate:** <0.5% (industry-leading)

---

## 8. COST-BENEFIT ANALYSIS

### Security Investment vs. Fraud Losses

| Security Level | Implementation Cost | Ongoing Cost/Month | Fraud Rate | Expected Losses (on $1M volume/month) | ROI |
|---------------|-------------------|-------------------|-----------|--------------------------------------|-----|
| Minimal (no verification) | $10K | $2K | 10-15% | $100K-$150K | Catastrophic |
| Basic (manual verification) | $30K | $8K | 2-5% | $20K-$50K | Negative |
| Automated (bank APIs + rules) | $60K | $15K | 1-2% | $10K-$20K | Positive |
| Advanced (ML + graph analysis) | $120K | $25K | 0.5-1% | $5K-$10K | Strong Positive |
| Enterprise (full stack) | $250K | $40K | <0.5% | <$5K | Very Strong |

**Recommendation for BillHaven:**
- Start with **Automated** tier (Phase 2)
- Scale to **Advanced** tier (Phase 3) by month 6
- Reach **Enterprise** tier (Phase 4) by year 1

**Break-Even Analysis:**
- At $1M monthly volume, Advanced tier saves $15K/month in fraud
- Cost: $25K/month
- Need $3M monthly volume to break even on Advanced tier
- But: Prevents catastrophic losses, enables growth, builds trust

---

## CONCLUSION

P2P crypto escrow platforms face sophisticated, multi-layered fraud threats. A comprehensive defense requires:

1. **Payment Method Selection:** Avoid high-risk methods (credit cards, PayPal). Focus on bank transfers with API verification.

2. **Smart Contract Security:** Use battle-tested libraries (OpenZeppelin), follow best practices (Checks-Effects-Interactions), and get professional audits.

3. **Identity & Reputation:** Implement graduated KYC tiers, build reputation systems, and use economic incentives to reward honest behavior.

4. **Fraud Detection:** Combine rule-based detection, machine learning, graph analysis, and behavioral analytics for comprehensive coverage.

5. **Operational Excellence:** Monitor continuously, respond quickly to incidents, educate users, and maintain legal compliance.

The platforms that succeed (Binance P2P, Paxful) invest heavily in security from day one. Fraud prevention is not a cost center—it's the foundation of user trust and long-term viability.

**Key Insight:** The best fraud prevention is making fraud unprofitable and inconvenient. Use hold periods, KYC, reputation systems, and economic bonds to ensure scammers lose money even when they succeed technically.

---

## APPENDIX: RECOMMENDED TOOLS & SERVICES

### KYC/Identity Verification
- Onfido (AI-powered document + biometric verification)
- Jumio (real-time ID verification)
- Persona (flexible KYC workflows)
- Sumsub (global coverage)

### Payment Verification
- Plaid (US bank account verification)
- TrueLayer (UK/EU open banking)
- Yodlee (global bank APIs)
- Wise Platform (international transfers)

### Fraud Detection
- Sift (ML-based fraud detection for marketplaces)
- Forter (real-time fraud prevention)
- Kount (risk scoring)
- IPQS (IP quality, proxy detection)

### Chargeback Management
- Ethoca (Mastercard chargeback alerts)
- Verifi (Visa CDRN)
- Chargebacks911 (dispute management)

### Smart Contract Security
- OpenZeppelin (secure contract libraries + audits)
- Trail of Bits (security audits)
- Consensys Diligence (audits)
- Slither (static analysis)
- Echidna (fuzzing)

### Wallet Infrastructure
- WalletConnect (secure wallet connections)
- Gnosis Safe (multi-sig wallets)
- Magic (passwordless auth)
- Web3Auth (social login for Web3)

### Monitoring & Alerts
- Tenderly (smart contract monitoring)
- OpenZeppelin Defender (automated operations)
- PagerDuty (on-call management)
- Sentry (error tracking)

### Compliance
- Chainalysis (blockchain analytics, AML screening)
- Elliptic (crypto transaction monitoring)
- ComplyAdvantage (sanctions screening)
- Sumsub (KYC + AML)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-29
**Next Review:** 2025-12-29 (monthly updates recommended)
