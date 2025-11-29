# BillHaven - Complete User Flow Design

**Version:** 1.0
**Date:** 2025-11-28
**Status:** Design Specification

---

## Table of Contents

1. [Flow Overview](#flow-overview)
2. [Bill Maker Flow](#bill-maker-flow)
3. [Payer Flow](#payer-flow)
4. [Dispute Flow](#dispute-flow)
5. [Cancel/Expire Flow](#cancelexpire-flow)
6. [Wireframe Descriptions](#wireframe-descriptions)
7. [State Machine](#state-machine)
8. [Error Handling](#error-handling)

---

## Flow Overview

### Core Principles
- **Trust through escrow**: Crypto locked on-chain, released only after confirmation
- **Transparency**: All states visible to both parties
- **Safety**: Multiple checkpoints and dispute resolution
- **Simplicity**: Clear steps with visual feedback

### User Roles
1. **Bill Maker**: Creates bill, locks crypto, confirms fiat payment
2. **Payer**: Claims bill, pays fiat, receives crypto
3. **Admin**: Resolves disputes (future: DAO governance)

---

## Bill Maker Flow

### Step 1: Connect Wallet

**Screen:** Landing Page / Dashboard
**UI Components:**
- Hero section with "Connect Wallet" button
- Supported wallets: MetaMask, WalletConnect, Coinbase Wallet
- Network indicator (Sepolia testnet)

**Button Text:** "Connect Wallet"

**User Actions:**
1. Click "Connect Wallet"
2. Select wallet provider from modal
3. Approve connection in wallet extension

**Blockchain:**
- Read wallet address
- Check network (must be Sepolia)
- Check if wallet has ETH for gas

**Database:**
- Log wallet connection event
- Check if user exists, create profile if new

**Success Message:**
```
✓ Wallet connected: 0x1234...5678
Network: Sepolia Testnet
```

**Error Messages:**
```
⚠ Wrong network detected. Please switch to Sepolia Testnet.
⚠ Wallet connection rejected. Please try again.
⚠ No wallet detected. Please install MetaMask.
```

**Loading States:**
- "Connecting wallet..."
- Spinner on connect button

---

### Step 2: Create Bill

**Screen:** Create Bill Form
**UI Components:**
- Bill type selector (Utility, Rent, Service, Other)
- Amount input (USD with USDC equivalent)
- Description textarea (max 500 chars)
- Crypto amount calculator (shows USDC needed)
- Expiry date selector (1-7 days)
- Terms & conditions checkbox
- "Create & Lock Crypto" button

**Form Fields:**
```
Bill Type: [Dropdown] Utility / Rent / Service / Other
Amount (USD): [Input] $___.__
Description: [Textarea] What is this bill for?
Crypto to Lock: [Display] ___.__ USDC (auto-calculated)
Expires In: [Dropdown] 1 day / 3 days / 7 days
[ ] I agree to lock crypto in escrow until payment confirmed
```

**Button Text:** "Create & Lock Crypto"

**User Actions:**
1. Fill out bill details
2. Review crypto amount to lock
3. Click "Create & Lock Crypto"
4. Sign transaction in wallet

**Blockchain:**
```javascript
// Smart contract call
BillHavenEscrow.createBill(
  usdcAmount,      // e.g., 1000000 (1 USDC = 1e6)
  billHash,        // IPFS hash of bill metadata
  expiryTimestamp  // Unix timestamp
)

// Events emitted
event BillCreated(
  uint256 indexed billId,
  address indexed maker,
  uint256 amount,
  uint256 expiryTime
)
```

**Database:**
```json
{
  "billId": 1,
  "maker": "0x1234...5678",
  "amount": 100.00,
  "amountUSDC": "100000000",
  "description": "Electric bill for November 2025",
  "type": "Utility",
  "status": "OPEN",
  "expiryDate": "2025-12-05T23:59:59Z",
  "createdAt": "2025-11-28T10:00:00Z",
  "ipfsHash": "QmXyz...",
  "txHash": "0xabc..."
}
```

**Success Message:**
```
✓ Bill created successfully!
Bill ID: #0001
Crypto locked: 100 USDC
Expires: Dec 5, 2025
Share this link with payers: billhaven.com/bill/0001
```

**Error Messages:**
```
⚠ Insufficient USDC balance. You need 100 USDC + gas.
⚠ Transaction failed. Please check gas settings.
⚠ Bill amount must be at least $10.
⚠ Description is required.
⚠ You must approve USDC spending first.
```

**Loading States:**
- "Waiting for approval..." (if USDC needs approval)
- "Creating bill and locking crypto..."
- Progress bar: "Step 1 of 2: Approving USDC" / "Step 2 of 2: Creating bill"

---

### Step 3: Lock Crypto in Escrow

**Screen:** Transaction Confirmation
**UI Components:**
- Transaction summary card
- Gas fee estimate
- Total cost breakdown
- Security checklist
- "Confirm Transaction" button

**Transaction Summary:**
```
┌─────────────────────────────────┐
│ Lock Crypto in Escrow           │
├─────────────────────────────────┤
│ Bill Amount:    100 USDC        │
│ Gas Fee:        ~0.002 ETH      │
│ Total Cost:     100 USDC + gas  │
│                                 │
│ Your crypto will be locked      │
│ until payer completes payment   │
│ or bill expires.                │
└─────────────────────────────────┘
```

**Button Text:** "Sign Transaction"

**User Actions:**
1. Review transaction details
2. Click "Sign Transaction"
3. Approve in MetaMask
4. Wait for confirmation

**Blockchain:**
```solidity
// USDC approval (if not already approved)
USDC.approve(escrowContract, amount)

// Create bill and lock crypto
escrow.createBill(amount, billHash, expiryTime)
```

**Database:**
- Update bill status to "OPEN"
- Store transaction hash
- Store block number for indexing

**Success Message:**
```
✓ Crypto locked successfully!
Transaction: 0xabc...def [View on Etherscan]
Your bill is now public and claimable.
```

**Error Messages:**
```
⚠ Transaction rejected by user.
⚠ Insufficient ETH for gas fees.
⚠ USDC approval failed. Please try again.
⚠ Network congestion. Higher gas fee recommended.
```

**Loading States:**
- "Confirming transaction..."
- "Waiting for blockchain confirmation..."
- Block confirmation counter: "1/3 confirmations"

---

### Step 4: Wait for Payer to Claim

**Screen:** Bill Dashboard / Bill Detail Page
**UI Components:**
- Bill status badge: "OPEN - Waiting for Payer"
- Share button (copy link, QR code)
- Time remaining countdown
- View on explorer link
- Cancel bill button (only if unclaimed)

**Bill Card:**
```
┌─────────────────────────────────┐
│ 🔓 OPEN                         │
│ Bill #0001 - Electric Bill      │
├─────────────────────────────────┤
│ Amount:       $100.00           │
│ Locked:       100 USDC          │
│ Created:      Nov 28, 2025      │
│ Expires:      Dec 5, 2025       │
│ Time Left:    6 days 14 hours   │
│                                 │
│ Status: Waiting for payer...    │
│                                 │
│ [Share Bill] [Cancel Bill]      │
└─────────────────────────────────┘
```

**Button Text:** "Share Bill" / "Cancel Bill"

**User Actions:**
1. Monitor bill status
2. Share link with potential payers
3. Optional: Cancel if no claims

**Blockchain:**
- No on-chain activity
- Listen for `BillClaimed` event

**Database:**
- Track page views
- Log share events
- Update last activity timestamp

**Success Message:**
```
✓ Bill shared successfully!
Link copied to clipboard.
```

**Error Messages:**
```
⚠ Cannot cancel bill - already claimed by payer.
⚠ Bill expired. Crypto will be refunded.
```

**Loading States:**
- Real-time status updates via WebSocket
- "Refreshing status..."

---

### Step 5: Receive Fiat Payment (Off-Chain)

**Screen:** Bill Detail Page (Updated)
**UI Components:**
- Payer information card
- Payment instructions display
- Payment proof uploaded by payer
- "I Received Payment" button
- "Raise Dispute" button

**Status Update:**
```
┌─────────────────────────────────┐
│ 🔒 CLAIMED                      │
│ Bill #0001 - Electric Bill      │
├─────────────────────────────────┤
│ Amount:       $100.00           │
│ Locked:       100 USDC          │
│ Claimed By:   0x9876...5432     │
│ Claimed At:   Nov 28, 3:45 PM   │
│                                 │
│ ⏳ Waiting for fiat payment     │
│                                 │
│ Payer Details:                  │
│ • Wallet: 0x9876...5432         │
│ • Payment Method: Bank Transfer │
│ • Proof: [View Screenshot]      │
│                                 │
│ [✓ I Received Payment]          │
│ [⚠ Raise Dispute]               │
└─────────────────────────────────┘
```

**Button Text:** "I Received Payment" / "Raise Dispute"

**User Actions:**
1. Receive notification of claim
2. Check bank account for fiat payment
3. Review payment proof from payer
4. Verify payment matches bill amount
5. Click "I Received Payment" when confirmed

**Blockchain:**
- No on-chain activity yet
- Bill status: `CLAIMED` (on-chain)

**Database:**
```json
{
  "billId": 1,
  "status": "CLAIMED",
  "payer": "0x9876...5432",
  "claimedAt": "2025-11-28T15:45:00Z",
  "paymentProof": "ipfs://QmAbc...",
  "paymentMethod": "Bank Transfer",
  "notificationsSent": [
    {
      "type": "email",
      "to": "maker@example.com",
      "sent": "2025-11-28T15:45:30Z"
    }
  ]
}
```

**Success Message:**
```
✓ Notification sent to payer!
Please check your bank account for the fiat payment.
Verify the amount matches before confirming.
```

**Error Messages:**
```
⚠ Payment proof not uploaded by payer yet.
⚠ Cannot view payment proof - file not found.
```

**Loading States:**
- "Loading payment proof..."
- "Checking blockchain status..."

---

### Step 6: Confirm Fiat Received

**Screen:** Payment Confirmation Modal
**UI Components:**
- Confirmation checklist
- Warning about irreversibility
- Final confirmation button
- Security tips

**Confirmation Modal:**
```
┌─────────────────────────────────┐
│ Confirm Fiat Payment Received   │
├─────────────────────────────────┤
│ Before confirming, verify:       │
│                                 │
│ [✓] I received $100.00 in fiat  │
│ [✓] Payment is from payer       │
│ [✓] Amount matches bill exactly │
│ [✓] Payment is not reversible   │
│                                 │
│ ⚠ WARNING: This action is       │
│ IRREVERSIBLE. Once confirmed,   │
│ 100 USDC will be sent to payer. │
│                                 │
│ [Cancel] [Confirm & Release]    │
└─────────────────────────────────┘
```

**Button Text:** "Confirm & Release Crypto"

**User Actions:**
1. Check all verification boxes
2. Click "Confirm & Release Crypto"
3. Sign transaction in wallet
4. Wait for confirmation

**Blockchain:**
```solidity
// Smart contract call
BillHavenEscrow.confirmPayment(billId)

// Events emitted
event PaymentConfirmed(
  uint256 indexed billId,
  address indexed maker,
  address indexed payer,
  uint256 amount
)

event CryptoReleased(
  uint256 indexed billId,
  address payer,
  uint256 amount
)
```

**Database:**
```json
{
  "billId": 1,
  "status": "COMPLETED",
  "completedAt": "2025-11-28T16:00:00Z",
  "confirmTxHash": "0xdef...",
  "releaseTxHash": "0xghi...",
  "finalAmount": "100000000",
  "platformFee": "1000000",
  "payerReceived": "99000000"
}
```

**Success Message:**
```
✓ Payment confirmed!
100 USDC released to payer: 0x9876...5432
Transaction: 0xdef...ghi [View on Etherscan]
Bill completed successfully.
```

**Error Messages:**
```
⚠ Transaction rejected. Crypto remains locked.
⚠ Insufficient gas. Please add ETH and retry.
⚠ Cannot confirm - bill was disputed.
⚠ Cannot confirm - bill expired.
```

**Loading States:**
- "Confirming payment..."
- "Releasing crypto to payer..."
- "Processing transaction..." (1/3 confirmations)

---

### Step 7: Done - Transaction Complete

**Screen:** Transaction Success Page
**UI Components:**
- Success animation/confetti
- Transaction summary
- Receipt download button
- Rating/review prompt
- "Create Another Bill" button

**Success Screen:**
```
┌─────────────────────────────────┐
│      🎉 Transaction Complete!    │
├─────────────────────────────────┤
│ Bill #0001 - Electric Bill      │
│                                 │
│ ✓ Fiat received:    $100.00     │
│ ✓ Crypto released:  100 USDC    │
│ ✓ Sent to:          0x9876...   │
│                                 │
│ Transaction Details:            │
│ • Completed: Nov 28, 4:00 PM    │
│ • Total Time: 15 minutes        │
│ • Tx Hash: 0xdef...ghi          │
│                                 │
│ [Download Receipt]              │
│ [Create Another Bill]           │
│                                 │
│ Rate your experience: ⭐⭐⭐⭐⭐  │
└─────────────────────────────────┘
```

**Button Text:** "Download Receipt" / "Create Another Bill"

**User Actions:**
1. View transaction summary
2. Download receipt (PDF)
3. Rate experience (optional)
4. Create another bill (optional)

**Blockchain:**
- Bill status: `COMPLETED` (on-chain)
- Crypto transferred to payer
- Escrow released

**Database:**
```json
{
  "billId": 1,
  "status": "COMPLETED",
  "completedAt": "2025-11-28T16:00:00Z",
  "rating": 5,
  "review": "Great experience, fast and secure!",
  "receiptGenerated": true,
  "receiptUrl": "ipfs://QmReceipt..."
}
```

**Success Message:**
```
✓ Receipt downloaded successfully!
Thank you for using BillHaven!
```

**Error Messages:**
```
⚠ Receipt generation failed. Please try again.
```

**Loading States:**
- "Generating receipt..."
- "Uploading to IPFS..."

---

## Payer Flow

### Step 1: Browse Public Bills

**Screen:** Browse Bills / Marketplace
**UI Components:**
- Search bar (by bill ID, type, amount)
- Filter sidebar (type, amount range, expiry)
- Bill cards grid
- Sort options (newest, expiring soon, amount)
- Pagination

**Browse Interface:**
```
┌─────────────────────────────────────────────┐
│ Browse Bills                    [Search...] │
├─────────────────────────────────────────────┤
│ Filters:                                    │
│ Type: [All] Utility Rent Service Other      │
│ Amount: $10 - $1000                         │
│ Expires: [All] Today This Week This Month   │
└─────────────────────────────────────────────┘

┌───────────┐ ┌───────────┐ ┌───────────┐
│ OPEN      │ │ OPEN      │ │ OPEN      │
│ #0001     │ │ #0002     │ │ #0003     │
│ Utility   │ │ Rent      │ │ Service   │
│ $100      │ │ $1,200    │ │ $50       │
│ Exp: 6d   │ │ Exp: 2d   │ │ Exp: 7d   │
│ [Claim]   │ │ [Claim]   │ │ [Claim]   │
└───────────┘ └───────────┘ └───────────┘
```

**Button Text:** "Claim Bill"

**User Actions:**
1. Browse available bills
2. Filter by preferences
3. Click on bill card to view details
4. Click "Claim Bill" to proceed

**Blockchain:**
- Read contract for open bills
- Filter by status == OPEN
- Check expiry timestamps

**Database:**
- Query bills with status "OPEN"
- Filter by search criteria
- Track views per bill

**Success Message:**
```
✓ Showing 42 available bills.
```

**Error Messages:**
```
⚠ No bills match your filters.
⚠ Unable to load bills. Please refresh.
```

**Loading States:**
- "Loading bills..."
- Skeleton cards while loading
- "Refreshing..."

---

### Step 2: Connect Wallet

**Screen:** Bill Detail Page
**UI Components:**
- Bill details card
- "Connect Wallet to Claim" button
- Trust indicators (maker rating, bill age)
- Required crypto amount display

**Bill Detail:**
```
┌─────────────────────────────────┐
│ Bill #0001 - Electric Bill      │
├─────────────────────────────────┤
│ Amount:          $100.00        │
│ You'll receive:  ~99 USDC       │
│ Platform fee:    1%             │
│                                 │
│ Bill Maker:                     │
│ • 0x1234...5678                 │
│ • Rating: ⭐⭐⭐⭐⭐ (12 trades)  │
│ • Member since: Oct 2025        │
│                                 │
│ Details:                        │
│ "Electric bill for November"    │
│                                 │
│ Expires: 6 days 14 hours        │
│                                 │
│ [Connect Wallet to Claim]       │
└─────────────────────────────────┘
```

**Button Text:** "Connect Wallet to Claim"

**User Actions:**
1. Review bill details
2. Check maker reputation
3. Click "Connect Wallet"
4. Select wallet provider
5. Approve connection

**Blockchain:**
- Check wallet address
- Verify network (Sepolia)
- Check if user is maker (can't claim own bill)

**Database:**
- Log wallet connection
- Create/update user profile
- Record bill view

**Success Message:**
```
✓ Wallet connected: 0x9876...5432
You can now claim this bill.
```

**Error Messages:**
```
⚠ You cannot claim your own bill.
⚠ Wrong network. Switch to Sepolia.
⚠ Wallet connection failed.
```

**Loading States:**
- "Connecting wallet..."
- Spinner on button

---

### Step 3: Claim Bill

**Screen:** Claim Bill Modal
**UI Components:**
- Claim confirmation
- Payment instructions form
- Terms agreement
- "Claim & Lock" button

**Claim Modal:**
```
┌─────────────────────────────────┐
│ Claim Bill #0001                │
├─────────────────────────────────┤
│ You will receive: 99 USDC       │
│ After paying:     $100.00 fiat  │
│                                 │
│ Payment Instructions:           │
│ How will you pay the maker?     │
│ [Dropdown] Bank Transfer        │
│            PayPal               │
│            Venmo                │
│            Cash App             │
│            Other                │
│                                 │
│ Payment Details (optional):     │
│ [Input] e.g., "From JPMorgan    │
│         account ending in 1234" │
│                                 │
│ [ ] I agree to pay $100.00 to   │
│     the bill maker via the      │
│     method above within 24 hrs  │
│                                 │
│ [ ] I understand my wallet will │
│     be locked to this bill      │
│                                 │
│ [Cancel] [Claim Bill]           │
└─────────────────────────────────┘
```

**Button Text:** "Claim Bill"

**User Actions:**
1. Select payment method
2. Add payment details (optional)
3. Check agreement boxes
4. Click "Claim Bill"
5. Sign transaction

**Blockchain:**
```solidity
// Smart contract call
BillHavenEscrow.claimBill(billId)

// Events emitted
event BillClaimed(
  uint256 indexed billId,
  address indexed payer,
  uint256 timestamp
)
```

**Database:**
```json
{
  "billId": 1,
  "status": "CLAIMED",
  "payer": "0x9876...5432",
  "paymentMethod": "Bank Transfer",
  "paymentDetails": "From JPMorgan ending in 1234",
  "claimedAt": "2025-11-28T15:45:00Z",
  "claimTxHash": "0xjkl...",
  "mustPayBy": "2025-11-29T15:45:00Z"
}
```

**Success Message:**
```
✓ Bill claimed successfully!
Transaction: 0xjkl...mno [View on Etherscan]

Next Steps:
1. Pay $100.00 to bill maker via Bank Transfer
2. Upload payment proof
3. Wait for maker to confirm
4. Receive 99 USDC automatically
```

**Error Messages:**
```
⚠ Bill already claimed by another user.
⚠ Bill expired. Cannot claim.
⚠ Transaction rejected.
⚠ You must agree to terms.
```

**Loading States:**
- "Claiming bill..."
- "Waiting for confirmation..."
- "Processing..." (1/3 confirmations)

---

### Step 4: Pay Fiat to Bill Maker

**Screen:** Payment Instructions Page
**UI Components:**
- Maker contact information
- Payment method details
- Amount to pay (highlighted)
- Countdown timer (24 hours)
- Upload proof section
- "I Paid" button

**Payment Screen:**
```
┌─────────────────────────────────┐
│ 💳 Complete Fiat Payment        │
├─────────────────────────────────┤
│ Bill #0001 - Electric Bill      │
│                                 │
│ PAY THIS AMOUNT: $100.00        │
│ Payment Method: Bank Transfer   │
│                                 │
│ ⏰ Pay within: 23h 45m           │
│                                 │
│ Bill Maker Contact:             │
│ • Wallet: 0x1234...5678         │
│ • Payment Info: [View Details]  │
│                                 │
│ Instructions:                   │
│ 1. Send $100.00 via your bank   │
│ 2. Use reference: BILL-0001     │
│ 3. Upload proof of payment      │
│ 4. Wait for maker to confirm    │
│                                 │
│ [Upload Payment Proof]          │
│ [I Paid - Mark as Sent]         │
└─────────────────────────────────┘
```

**Button Text:** "Upload Payment Proof" / "I Paid"

**User Actions:**
1. Contact maker (off-chain)
2. Send fiat payment via selected method
3. Take screenshot/photo of payment
4. Upload proof to BillHaven
5. Click "I Paid"

**Blockchain:**
- No on-chain activity
- Bill status remains `CLAIMED`

**Database:**
```json
{
  "billId": 1,
  "status": "CLAIMED",
  "paymentProof": "ipfs://QmProof...",
  "paymentProofType": "image/png",
  "paymentProofSize": 245678,
  "paidMarkedAt": "2025-11-28T16:00:00Z",
  "notificationsSent": [
    {
      "type": "email",
      "to": "maker@example.com",
      "subject": "Payment proof uploaded for Bill #0001"
    }
  ]
}
```

**Success Message:**
```
✓ Payment proof uploaded!
✓ Marked as paid
Maker has been notified. Waiting for confirmation...
You'll receive 99 USDC once maker confirms.
```

**Error Messages:**
```
⚠ File too large. Max 5MB.
⚠ Invalid file type. Use PNG, JPG, or PDF.
⚠ Upload failed. Please try again.
⚠ You must upload proof before marking as paid.
```

**Loading States:**
- "Uploading to IPFS..."
- "Processing image..."
- "Notifying maker..."

---

### Step 5: Upload Payment Proof

**Screen:** Upload Modal
**UI Components:**
- Drag-and-drop upload zone
- File preview
- File size/type indicator
- Optional notes field
- "Upload" button

**Upload Modal:**
```
┌─────────────────────────────────┐
│ Upload Payment Proof            │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │  Drag & drop file here      │ │
│ │  or click to browse         │ │
│ │                             │ │
│ │  Accepted: PNG, JPG, PDF    │ │
│ │  Max size: 5 MB             │ │
│ └─────────────────────────────┘ │
│                                 │
│ Selected: payment_proof.png     │
│ Size: 1.2 MB                    │
│                                 │
│ Add Note (optional):            │
│ [Input] "Sent from Chase bank   │
│         on Nov 28 at 3:55 PM"   │
│                                 │
│ [Cancel] [Upload Proof]         │
└─────────────────────────────────┘
```

**Button Text:** "Upload Proof"

**User Actions:**
1. Drag file or click to browse
2. Select payment screenshot/receipt
3. Add optional note
4. Click "Upload Proof"
5. Wait for IPFS upload

**Blockchain:**
- No on-chain activity
- Proof stored off-chain (IPFS)

**Database:**
```json
{
  "proofId": "proof_001",
  "billId": 1,
  "uploader": "0x9876...5432",
  "ipfsHash": "QmProof123...",
  "fileName": "payment_proof.png",
  "fileType": "image/png",
  "fileSize": 1258291,
  "note": "Sent from Chase bank on Nov 28 at 3:55 PM",
  "uploadedAt": "2025-11-28T15:55:00Z"
}
```

**Success Message:**
```
✓ Payment proof uploaded successfully!
IPFS Hash: QmProof123... [View]
Maker will review and confirm payment.
```

**Error Messages:**
```
⚠ Upload failed. Check your connection.
⚠ File exceeds 5MB limit.
⚠ Unsupported file type.
⚠ IPFS gateway unavailable. Try again later.
```

**Loading States:**
- "Uploading to IPFS..." (0-30s)
- "Processing file..."
- Progress bar: 45% uploaded

---

### Step 6: Wait for Confirmation

**Screen:** Bill Status Page
**UI Components:**
- Status timeline/progress bar
- Expected wait time
- Maker activity indicator
- Auto-refresh toggle
- Dispute button (if >24h)

**Status Page:**
```
┌─────────────────────────────────┐
│ ⏳ Waiting for Confirmation     │
├─────────────────────────────────┤
│ Bill #0001 - Electric Bill      │
│                                 │
│ Status Timeline:                │
│ ✓ Bill claimed                  │
│ ✓ Payment sent                  │
│ ✓ Proof uploaded                │
│ ⏳ Waiting for maker confirm... │
│ ⏱ Receive crypto                │
│                                 │
│ Maker last seen: 5 minutes ago  │
│ Average confirm time: 15 min    │
│                                 │
│ Your payment proof:             │
│ [View Screenshot]               │
│                                 │
│ Auto-refresh: ON [Toggle]       │
│                                 │
│ Need help?                      │
│ [Contact Support]               │
│ [Raise Dispute] (after 24h)     │
└─────────────────────────────────┘
```

**Button Text:** "Refresh Status" / "Raise Dispute"

**User Actions:**
1. Monitor status updates
2. Wait for maker confirmation
3. Optional: Contact support
4. Optional: Raise dispute if >24h

**Blockchain:**
- Listen for `PaymentConfirmed` event
- Listen for `CryptoReleased` event

**Database:**
- Track status checks
- Log last activity times
- Monitor for timeout conditions

**Success Message:**
```
✓ Status updated
Maker is online and reviewing...
```

**Error Messages:**
```
⚠ Connection lost. Reconnecting...
⚠ Cannot raise dispute yet. Wait 24 hours.
```

**Loading States:**
- "Checking status..."
- Real-time updates via WebSocket
- Pulse animation on waiting step

---

### Step 7: Receive Crypto Automatically

**Screen:** Success Page
**UI Components:**
- Success animation
- Crypto received notification
- Transaction details
- Wallet balance update
- Rate experience prompt
- "Browse More Bills" button

**Success Screen:**
```
┌─────────────────────────────────┐
│     🎉 Crypto Received!          │
├─────────────────────────────────┤
│ Bill #0001 - Electric Bill      │
│                                 │
│ ✓ Received: 99 USDC             │
│ ✓ To wallet: 0x9876...5432      │
│ ✓ Tx Hash: 0xdef...ghi          │
│                                 │
│ Transaction Summary:            │
│ • Paid fiat: $100.00            │
│ • Received crypto: 99 USDC      │
│ • Platform fee: 1 USDC (1%)     │
│ • Total time: 15 minutes        │
│                                 │
│ [View on Etherscan]             │
│ [Download Receipt]              │
│                                 │
│ Rate this trade: ⭐⭐⭐⭐⭐       │
│                                 │
│ [Browse More Bills]             │
└─────────────────────────────────┘
```

**Button Text:** "Browse More Bills" / "Download Receipt"

**User Actions:**
1. View crypto in wallet (auto-refresh)
2. Download receipt
3. Rate experience
4. Browse more bills

**Blockchain:**
- Crypto transferred to payer wallet
- Bill status: `COMPLETED`
- Escrow released

**Database:**
```json
{
  "billId": 1,
  "status": "COMPLETED",
  "completedAt": "2025-11-28T16:10:00Z",
  "payerRating": 5,
  "payerReview": "Super fast! Maker confirmed in 10 mins.",
  "totalDuration": 900,
  "receiptGenerated": true
}
```

**Success Message:**
```
✓ Transaction complete!
99 USDC is now in your wallet.
Thank you for using BillHaven!
```

**Error Messages:**
```
⚠ Receipt download failed. Try again.
```

**Loading States:**
- "Loading transaction details..."
- "Generating receipt..."

---

## Dispute Flow

### Step 1: Either Party Raises Dispute

**Screen:** Dispute Modal
**UI Components:**
- Dispute reason selector
- Evidence upload section
- Description textarea
- "Submit Dispute" button
- Warning about admin review

**Dispute Modal:**
```
┌─────────────────────────────────┐
│ ⚠ Raise Dispute                 │
├─────────────────────────────────┤
│ Bill #0001 - Electric Bill      │
│                                 │
│ Reason for dispute:             │
│ [Dropdown]                      │
│ - Payment not received          │
│ - Wrong amount sent             │
│ - Maker unresponsive            │
│ - Payer not paying              │
│ - Other                         │
│                                 │
│ Explain the issue:              │
│ [Textarea] Max 1000 characters  │
│                                 │
│ Upload evidence (optional):     │
│ [Upload] Screenshots, receipts  │
│                                 │
│ ⚠ WARNING:                      │
│ • Admin will review evidence    │
│ • Decision is final             │
│ • False disputes = account ban  │
│                                 │
│ [Cancel] [Submit Dispute]       │
└─────────────────────────────────┘
```

**Button Text:** "Submit Dispute"

**User Actions:**
1. Select dispute reason
2. Write detailed explanation
3. Upload supporting evidence
4. Click "Submit Dispute"
5. Sign transaction (locks bill)

**Blockchain:**
```solidity
// Smart contract call
BillHavenEscrow.raiseDispute(billId, evidenceHash)

// Events emitted
event DisputeRaised(
  uint256 indexed billId,
  address indexed initiator,
  string evidenceHash,
  uint256 timestamp
)
```

**Database:**
```json
{
  "disputeId": "dispute_001",
  "billId": 1,
  "initiator": "0x9876...5432",
  "reason": "Payment not received",
  "description": "I sent $100 via bank transfer on Nov 28 but maker has not confirmed. See attached proof.",
  "evidence": [
    "ipfs://QmEvidence1...",
    "ipfs://QmEvidence2..."
  ],
  "status": "PENDING_REVIEW",
  "createdAt": "2025-11-29T10:00:00Z",
  "adminAssigned": null
}
```

**Success Message:**
```
✓ Dispute submitted successfully!
Dispute ID: #D-001
An admin will review within 24-48 hours.
You'll be notified of the decision.
```

**Error Messages:**
```
⚠ Cannot raise dispute - already resolved.
⚠ Must wait 24 hours after claim to dispute.
⚠ Description required (min 50 characters).
⚠ Evidence upload failed.
```

**Loading States:**
- "Submitting dispute..."
- "Uploading evidence to IPFS..."
- "Locking bill on-chain..."

---

### Step 2: Admin Reviews Evidence

**Screen:** Admin Dashboard (Admin-only)
**UI Components:**
- Dispute queue
- Bill details
- Evidence viewer (maker + payer)
- Timeline of events
- Decision buttons
- Notes field

**Admin Dashboard:**
```
┌─────────────────────────────────────────────┐
│ Admin Dispute Review                        │
├─────────────────────────────────────────────┤
│ Dispute #D-001 | Bill #0001                 │
│ Raised by: Payer (0x9876...5432)            │
│ Reason: Payment not received                │
│ Created: Nov 29, 10:00 AM (2 hours ago)     │
│                                             │
│ ──────────── MAKER SIDE ────────────        │
│ • Created bill: Nov 28, 10:00 AM            │
│ • Locked 100 USDC                           │
│ • Has not confirmed payment yet             │
│ • Last active: Nov 28, 4:00 PM              │
│ • No evidence submitted                     │
│                                             │
│ ──────────── PAYER SIDE ────────────        │
│ • Claimed bill: Nov 28, 3:45 PM             │
│ • Payment method: Bank Transfer             │
│ • Marked paid: Nov 28, 4:00 PM              │
│ • Evidence: [View Screenshot 1]             │
│             [View Screenshot 2]             │
│                                             │
│ ──────── TIMELINE ────────                  │
│ Nov 28 10:00 - Bill created                 │
│ Nov 28 15:45 - Bill claimed by payer        │
│ Nov 28 16:00 - Payer marked as paid         │
│ Nov 29 10:00 - Dispute raised               │
│                                             │
│ Admin Notes:                                │
│ [Textarea] Investigation findings...        │
│                                             │
│ Decision:                                   │
│ [Release to Payer] [Refund to Maker]        │
└─────────────────────────────────────────────┘
```

**Button Text:** "Release to Payer" / "Refund to Maker"

**User Actions (Admin):**
1. Review bill timeline
2. Examine all evidence
3. Verify payment proof
4. Check blockchain events
5. Contact parties if needed
6. Make decision
7. Add notes for transparency

**Blockchain:**
- No on-chain activity (review only)
- Admin prepares resolution transaction

**Database:**
```json
{
  "disputeId": "dispute_001",
  "status": "UNDER_REVIEW",
  "adminAssigned": "admin@billhaven.com",
  "reviewStarted": "2025-11-29T12:00:00Z",
  "adminNotes": "Reviewed payment proof. Bank transfer screenshot shows $100 sent to maker on Nov 28. Maker was last active 18 hours ago but has not confirmed. Evidence supports payer claim.",
  "reviewDuration": 3600
}
```

**Success Message:**
```
✓ Dispute assigned to you.
Review deadline: Nov 30, 12:00 PM
```

**Error Messages:**
```
⚠ Cannot access evidence - IPFS timeout.
⚠ Blockchain data unavailable. Try again.
```

**Loading States:**
- "Loading evidence..."
- "Fetching blockchain events..."
- "Loading timeline..."

---

### Step 3: Admin Resolves (Release or Refund)

**Screen:** Resolution Confirmation Modal
**UI Components:**
- Decision summary
- Reasoning display
- Final confirmation
- "Execute Resolution" button

**Resolution Modal:**
```
┌─────────────────────────────────┐
│ Confirm Dispute Resolution      │
├─────────────────────────────────┤
│ Dispute #D-001 | Bill #0001     │
│                                 │
│ DECISION: Release to Payer      │
│                                 │
│ Reasoning:                      │
│ "Payment proof verified. Bank   │
│ transfer screenshot shows $100  │
│ sent on Nov 28. Maker has not   │
│ confirmed despite evidence.     │
│ Releasing 99 USDC to payer."    │
│                                 │
│ Action:                         │
│ • Release 99 USDC to payer      │
│ • Close bill as COMPLETED       │
│ • Notify both parties           │
│ • Update maker reputation (-1)  │
│                                 │
│ ⚠ This action is IRREVERSIBLE   │
│                                 │
│ [Cancel] [Execute Resolution]   │
└─────────────────────────────────┘
```

**Button Text:** "Execute Resolution"

**User Actions (Admin):**
1. Review decision summary
2. Click "Execute Resolution"
3. Sign transaction with admin key
4. Wait for confirmation

**Blockchain:**
```solidity
// Smart contract call (admin-only)
BillHavenEscrow.resolveDispute(billId, releaseToPayer)
// releaseToPayer = true or false

// Events emitted
event DisputeResolved(
  uint256 indexed billId,
  address indexed admin,
  bool releasedToPayer,
  uint256 timestamp
)

event CryptoReleased(
  uint256 indexed billId,
  address recipient,
  uint256 amount
)
```

**Database:**
```json
{
  "disputeId": "dispute_001",
  "status": "RESOLVED",
  "resolution": "RELEASE_TO_PAYER",
  "reasoning": "Payment proof verified. Maker unresponsive.",
  "resolvedBy": "admin@billhaven.com",
  "resolvedAt": "2025-11-29T14:00:00Z",
  "resolutionTxHash": "0xpqr...",
  "notificationsSent": [
    {
      "to": "payer",
      "message": "Dispute resolved in your favor. 99 USDC released."
    },
    {
      "to": "maker",
      "message": "Dispute resolved. Payment verified. Bill completed."
    }
  ],
  "reputationUpdates": [
    {
      "user": "0x1234...5678",
      "change": -1,
      "reason": "Unresponsive during dispute"
    }
  ]
}
```

**Success Message:**
```
✓ Dispute resolved successfully!
Transaction: 0xpqr...stu [View on Etherscan]
99 USDC released to payer.
Both parties notified.
```

**Error Messages:**
```
⚠ Resolution failed. Check admin permissions.
⚠ Transaction rejected.
⚠ Insufficient gas.
```

**Loading States:**
- "Executing resolution..."
- "Releasing crypto..."
- "Updating reputation..."
- "Notifying parties..."

---

## Cancel/Expire Flow

### Cancel Flow: Bill Maker Cancels Unclaimed Bill

**Screen:** Bill Detail Page
**UI Components:**
- "Cancel Bill" button (only visible if status = OPEN)
- Cancel confirmation modal
- Reason selector (optional)

**Cancel Modal:**
```
┌─────────────────────────────────┐
│ Cancel Bill #0001?              │
├─────────────────────────────────┤
│ Amount locked: 100 USDC         │
│                                 │
│ Reason (optional):              │
│ [Dropdown]                      │
│ - No longer need it             │
│ - Found another payer           │
│ - Bill paid already             │
│ - Other                         │
│                                 │
│ ⚠ This will:                    │
│ • Remove bill from marketplace  │
│ • Refund 100 USDC to you        │
│ • Cannot be undone              │
│                                 │
│ [Go Back] [Confirm Cancel]      │
└─────────────────────────────────┘
```

**Button Text:** "Cancel Bill"

**User Actions:**
1. Click "Cancel Bill" on dashboard
2. Confirm in modal
3. Sign refund transaction
4. Receive crypto back

**Blockchain:**
```solidity
// Smart contract call (maker-only)
BillHavenEscrow.cancelBill(billId)

// Events emitted
event BillCancelled(
  uint256 indexed billId,
  address indexed maker,
  uint256 refundAmount,
  uint256 timestamp
)
```

**Database:**
```json
{
  "billId": 1,
  "status": "CANCELLED",
  "cancelledAt": "2025-11-28T17:00:00Z",
  "cancelledBy": "0x1234...5678",
  "cancelReason": "No longer need it",
  "refundTxHash": "0xvwx...",
  "refundAmount": "100000000"
}
```

**Success Message:**
```
✓ Bill cancelled successfully!
100 USDC refunded to your wallet.
Transaction: 0xvwx...yz [View]
```

**Error Messages:**
```
⚠ Cannot cancel - bill already claimed.
⚠ Only bill maker can cancel.
⚠ Transaction rejected.
```

**Loading States:**
- "Cancelling bill..."
- "Processing refund..."

---

### Expire Flow: Bill Expires After 7 Days

**Screen:** Bill Detail Page (Auto-updated)
**UI Components:**
- Expired badge
- Auto-refund notification
- Countdown timer (before expiry)
- "Claim Refund" button (if not auto-processed)

**Expired Bill:**
```
┌─────────────────────────────────┐
│ ⏱ EXPIRED                       │
│ Bill #0001 - Electric Bill      │
├─────────────────────────────────┤
│ Amount:       $100.00           │
│ Locked:       100 USDC          │
│ Created:      Nov 28, 2025      │
│ Expired:      Dec 5, 2025       │
│                                 │
│ Status: Bill expired unclaimed  │
│                                 │
│ ✓ Auto-refund processed         │
│ 100 USDC returned to maker      │
│ Transaction: 0xabc...def        │
│                                 │
│ [View Transaction]              │
└─────────────────────────────────┘
```

**Button Text:** "Claim Refund" (if manual refund needed)

**User Actions:**
1. Wait for expiry (automatic)
2. Optional: Manually claim refund if auto-process fails
3. Receive crypto back

**Blockchain:**
```solidity
// Auto-triggered by keeper network or manual call
BillHavenEscrow.processExpiredBill(billId)

// Or maker can call
BillHavenEscrow.claimExpiredRefund(billId)

// Events emitted
event BillExpired(
  uint256 indexed billId,
  address indexed maker,
  uint256 refundAmount,
  uint256 timestamp
)
```

**Database:**
```json
{
  "billId": 1,
  "status": "EXPIRED",
  "expiryDate": "2025-12-05T23:59:59Z",
  "expiredAt": "2025-12-05T23:59:59Z",
  "refundProcessed": true,
  "refundTxHash": "0xabc...",
  "refundAmount": "100000000",
  "autoRefundTriggered": true,
  "processorAddress": "0xkeeper..."
}
```

**Success Message:**
```
✓ Refund claimed successfully!
100 USDC returned to your wallet.
```

**Error Messages:**
```
⚠ Bill not yet expired. Wait until Dec 5.
⚠ Refund already processed.
⚠ Only maker can claim refund.
```

**Loading States:**
- "Processing refund..."
- "Checking expiry status..."

---

## Wireframe Descriptions

### 1. Landing Page

**Layout:**
```
┌───────────────────────────────────────────┐
│ HEADER                                    │
│ [Logo] BillHaven    [Connect Wallet]     │
├───────────────────────────────────────────┤
│                                           │
│         HERO SECTION (Center)             │
│                                           │
│   Pay Bills with Crypto, Get Cash Back   │
│   The safest way to exchange crypto for  │
│   fiat payments through escrow            │
│                                           │
│   [Create Bill] [Browse Bills]            │
│                                           │
├───────────────────────────────────────────┤
│         HOW IT WORKS (3 Cards)            │
│                                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ 1.Lock  │  │ 2.Pay   │  │ 3.Confirm│  │
│  │ Crypto  │  │ Fiat    │  │ Release  │  │
│  └─────────┘  └─────────┘  └─────────┘  │
│                                           │
├───────────────────────────────────────────┤
│         STATS BAR                         │
│  $1.2M Traded | 1,234 Bills | 98% Success│
├───────────────────────────────────────────┤
│ FOOTER                                    │
│ Docs | FAQ | Twitter | Discord           │
└───────────────────────────────────────────┘
```

**Key Elements:**
- Large "Connect Wallet" button (top right)
- Hero CTA: "Create Bill" (primary) + "Browse Bills" (secondary)
- Trust indicators: Stats, security badges
- Sticky header on scroll

---

### 2. Create Bill Form

**Layout:**
```
┌───────────────────────────────────────────┐
│ ← Back to Dashboard     [User: 0x12...78]│
├───────────────────────────────────────────┤
│                                           │
│   CREATE NEW BILL                         │
│                                           │
│   Bill Type                               │
│   [Dropdown: Utility ▼]                   │
│                                           │
│   Amount (USD)                            │
│   [$______.__]                            │
│   ≈ _____ USDC at current rate            │
│                                           │
│   Description                             │
│   [Text area_________________]            │
│   [_________________________]            │
│                                           │
│   Expiry Period                           │
│   [Dropdown: 7 days ▼]                    │
│                                           │
│   ┌─────────────────────────────────┐    │
│   │ SUMMARY                         │    │
│   │ You will lock: 100 USDC         │    │
│   │ Payer will get: 99 USDC (1% fee)│    │
│   │ Expires: Dec 5, 2025            │    │
│   └─────────────────────────────────┘    │
│                                           │
│   [✓] I agree to lock crypto in escrow   │
│                                           │
│   [Create & Lock Crypto]                 │
│                                           │
└───────────────────────────────────────────┘
```

**Key Elements:**
- Real-time USD to USDC conversion
- Character counter on description (500 max)
- Summary card updates as user types
- Disabled submit until terms checked
- Clear gas fee estimate

---

### 3. Bill Dashboard (Maker View)

**Layout:**
```
┌───────────────────────────────────────────┐
│ My Bills          [+ Create New Bill]     │
├───────────────────────────────────────────┤
│ Filters: [All ▼] [Open] [Claimed] [Done] │
├───────────────────────────────────────────┤
│                                           │
│ ┌─────────────────────────────────────┐  │
│ │ 🔓 OPEN        Bill #0001           │  │
│ │ Utility - Electric Bill             │  │
│ │ Amount: $100 | Locked: 100 USDC     │  │
│ │ Expires: 6d 14h                     │  │
│ │ [Share] [Cancel]          [Details→]│  │
│ └─────────────────────────────────────┘  │
│                                           │
│ ┌─────────────────────────────────────┐  │
│ │ 🔒 CLAIMED     Bill #0002           │  │
│ │ Rent - December Rent                │  │
│ │ Amount: $1,200 | Locked: 1,200 USDC │  │
│ │ Claimed by: 0x98...32               │  │
│ │ [View Proof] [Confirm]    [Details→]│  │
│ └─────────────────────────────────────┘  │
│                                           │
│ ┌─────────────────────────────────────┐  │
│ │ ✓ COMPLETED    Bill #0003           │  │
│ │ Service - Web Design                │  │
│ │ Amount: $500 | Released: 495 USDC   │  │
│ │ Completed: Nov 25, 2025             │  │
│ │ [Receipt]                 [Details→]│  │
│ └─────────────────────────────────────┘  │
│                                           │
└───────────────────────────────────────────┘
```

**Key Elements:**
- Color-coded status badges
- Quick action buttons on each card
- Real-time countdown timers
- Filter/sort options
- Pagination for many bills

---

### 4. Browse Bills (Payer View)

**Layout:**
```
┌───────────────────────────────────────────┐
│ Browse Bills              [Connect Wallet]│
├───────────────────────────────────────────┤
│ [Search: Bill ID, type..._______________] │
│                                           │
│ FILTERS                    SORT: Newest ▼ │
│ Type: [All ▼]                             │
│ Amount: $10 - $10,000 [slider]            │
│ Expires: [All ▼]                          │
├───────────────────────────────────────────┤
│ Showing 42 bills                          │
│                                           │
│ ┌────────┐  ┌────────┐  ┌────────┐       │
│ │ OPEN   │  │ OPEN   │  │ OPEN   │       │
│ │ #0001  │  │ #0002  │  │ #0003  │       │
│ │ Utility│  │ Rent   │  │ Service│       │
│ │ $100   │  │ $1,200 │  │ $50    │       │
│ │ 99 USDC│  │ 1,188  │  │ 49.5   │       │
│ │ 6d left│  │ 2d left│  │ 7d left│       │
│ │        │  │        │  │        │       │
│ │[Claim] │  │[Claim] │  │[Claim] │       │
│ └────────┘  └────────┘  └────────┘       │
│                                           │
│ [Load More]                               │
└───────────────────────────────────────────┘
```

**Key Elements:**
- Grid layout (responsive: 3 cols desktop, 1 col mobile)
- Live search with debounce
- Filter sidebar (collapsible on mobile)
- Bill cards show key info at glance
- Hover effect shows more details

---

### 5. Bill Detail Page

**Layout:**
```
┌───────────────────────────────────────────┐
│ ← Back                       Share [📋]   │
├───────────────────────────────────────────┤
│                                           │
│   🔓 OPEN          Bill #0001             │
│                                           │
│   BILL DETAILS                            │
│   ┌─────────────────────────────────────┐│
│   │ Type:        Utility                ││
│   │ Amount:      $100.00                ││
│   │ You receive: 99 USDC (1% fee)       ││
│   │ Description: Electric bill Nov 2025 ││
│   │                                     ││
│   │ Created:     Nov 28, 10:00 AM       ││
│   │ Expires:     Dec 5, 11:59 PM        ││
│   │ Time left:   6 days 14 hours        ││
│   └─────────────────────────────────────┘│
│                                           │
│   MAKER INFO                              │
│   ┌─────────────────────────────────────┐│
│   │ Wallet:  0x1234...5678              ││
│   │ Rating:  ⭐⭐⭐⭐⭐ (12 trades)       ││
│   │ Joined:  Oct 2025                   ││
│   │ Success: 100%                       ││
│   └─────────────────────────────────────┘│
│                                           │
│   SMART CONTRACT                          │
│   ┌─────────────────────────────────────┐│
│   │ Network:    Sepolia Testnet         ││
│   │ Contract:   0xCONT...RACT           ││
│   │ Bill ID:    #0001                   ││
│   │ [View on Etherscan]                 ││
│   └─────────────────────────────────────┘│
│                                           │
│   [Claim This Bill]                       │
│                                           │
└───────────────────────────────────────────┘
```

**Key Elements:**
- Large status badge at top
- Expandable sections
- Trust indicators (maker rating)
- Blockchain verification link
- Prominent CTA button

---

### 6. Payment Instructions Page

**Layout:**
```
┌───────────────────────────────────────────┐
│ Bill #0001 - Payment Instructions         │
├───────────────────────────────────────────┤
│                                           │
│   ⏰ COMPLETE PAYMENT IN: 23h 45m         │
│                                           │
│   STEP 1: PAY MAKER                       │
│   ┌─────────────────────────────────────┐│
│   │ Amount:  $100.00 (exactly)          ││
│   │ Method:  Bank Transfer              ││
│   │                                     ││
│   │ Maker Contact:                      ││
│   │ • Email: maker@example.com          ││
│   │ • Bank: Chase, Acct #1234           ││
│   │                                     ││
│   │ Reference: BILLHAVEN-0001           ││
│   └─────────────────────────────────────┘│
│                                           │
│   STEP 2: UPLOAD PROOF                    │
│   ┌─────────────────────────────────────┐│
│   │ Take screenshot of:                 ││
│   │ • Bank transfer receipt             ││
│   │ • Payment confirmation              ││
│   │ • Transaction ID                    ││
│   │                                     ││
│   │ [Upload Screenshot]                 ││
│   └─────────────────────────────────────┘│
│                                           │
│   STEP 3: MARK AS PAID                    │
│   [I Paid $100.00]                        │
│                                           │
│   ⚠ Do not mark as paid until you        │
│   actually sent the money!                │
│                                           │
└───────────────────────────────────────────┘
```

**Key Elements:**
- Large countdown timer
- Step-by-step instructions
- Maker contact info (revealed after claim)
- Upload zone with preview
- Warning before marking paid

---

### 7. Dispute Resolution (Admin)

**Layout:**
```
┌───────────────────────────────────────────┐
│ Admin: Dispute Review                     │
├───────────────────────────────────────────┤
│ Queue: [Pending (5)] [Under Review (2)]   │
├───────────────────────────────────────────┤
│                                           │
│ Dispute #D-001 | Bill #0001               │
│ Raised: 2 hours ago by Payer              │
│                                           │
│ ┌─────────────────┬─────────────────────┐│
│ │ MAKER SIDE      │ PAYER SIDE          ││
│ │                 │                     ││
│ │ 0x1234...5678   │ 0x9876...5432       ││
│ │ ⭐⭐⭐⭐⭐        │ ⭐⭐⭐⭐⭐           ││
│ │                 │                     ││
│ │ Claims:         │ Claims:             ││
│ │ "Payer never    │ "I paid on Nov 28.  ││
│ │  paid me"       │  See proof below."  ││
│ │                 │                     ││
│ │ Evidence:       │ Evidence:           ││
│ │ None            │ [Screenshot 1]      ││
│ │                 │ [Screenshot 2]      ││
│ └─────────────────┴─────────────────────┘│
│                                           │
│ TIMELINE                                  │
│ ├─ Nov 28 10:00: Bill created            │
│ ├─ Nov 28 15:45: Claimed by payer        │
│ ├─ Nov 28 16:00: Payer marked paid       │
│ ├─ Nov 29 10:00: Dispute raised          │
│ └─ Now: Under admin review               │
│                                           │
│ DECISION                                  │
│ Admin Notes:                              │
│ [___________________________________]    │
│                                           │
│ [Release to Payer] [Refund to Maker]     │
│                                           │
└───────────────────────────────────────────┘
```

**Key Elements:**
- Split view: maker vs payer
- Evidence viewer with zoom
- Interactive timeline
- Notes field for transparency
- Clear decision buttons

---

## State Machine

### Bill States

```
                    createBill()
        START ─────────────────────► OPEN
                                       │
                                       │ claimBill()
                                       ▼
                                    CLAIMED ◄────┐
                                       │         │
                    confirmPayment()   │         │ raiseDispute()
                                       ▼         │
                                   COMPLETED     │
                                                 │
                                              DISPUTED
                                                 │
                          resolveDispute()       │
                                ┌────────────────┘
                                │
                    ┌───────────▼────────────┐
                    │                        │
                    ▼                        ▼
                COMPLETED                 REFUNDED


        OPEN ──────────────► CANCELLED (maker cancels)
        OPEN ──────────────► EXPIRED (timeout)
```

### State Transitions

| Current State | Event | Next State | Who Can Trigger |
|--------------|-------|------------|-----------------|
| START | createBill() | OPEN | Maker |
| OPEN | claimBill() | CLAIMED | Payer |
| OPEN | cancelBill() | CANCELLED | Maker |
| OPEN | expire() | EXPIRED | Auto/Anyone |
| CLAIMED | confirmPayment() | COMPLETED | Maker |
| CLAIMED | raiseDispute() | DISPUTED | Maker or Payer |
| DISPUTED | resolveDispute(true) | COMPLETED | Admin |
| DISPUTED | resolveDispute(false) | REFUNDED | Admin |

---

## Error Handling

### Common Errors and Solutions

**1. Wallet Connection Errors**

| Error | Message | Solution |
|-------|---------|----------|
| No wallet | "No Web3 wallet detected" | "Please install MetaMask or another Web3 wallet" |
| Wrong network | "Wrong network detected" | "Switch to Sepolia Testnet in your wallet settings" [Auto-switch button] |
| Rejected | "Connection rejected" | "Please approve the connection request in your wallet" |

**2. Transaction Errors**

| Error | Message | Solution |
|-------|---------|----------|
| Insufficient gas | "Insufficient ETH for gas" | "Add ETH to your wallet. Estimated gas: 0.002 ETH" |
| Insufficient USDC | "Insufficient USDC balance" | "You need 100 USDC. Current balance: 50 USDC" [Buy USDC] |
| User rejected | "Transaction rejected" | "The transaction was cancelled. Please try again." |
| Timeout | "Transaction timeout" | "Network congestion. Retry with higher gas?" [Retry] |

**3. Business Logic Errors**

| Error | Message | Solution |
|-------|---------|----------|
| Already claimed | "Bill already claimed" | "This bill was claimed by another user. Browse other bills." |
| Expired | "Bill expired" | "This bill expired. The maker has been refunded." |
| Self-claim | "Cannot claim own bill" | "You created this bill. Share it with others to claim." |
| Not maker | "Only bill maker can confirm" | "Wait for the bill maker to confirm your payment." |

**4. Upload Errors**

| Error | Message | Solution |
|-------|---------|----------|
| File too large | "File exceeds 5MB limit" | "Compress your image or use a smaller file" |
| Invalid type | "Unsupported file type" | "Use PNG, JPG, or PDF format" |
| IPFS timeout | "Upload failed" | "IPFS gateway unavailable. Retry in a few seconds" [Retry] |

**5. Dispute Errors**

| Error | Message | Solution |
|-------|---------|----------|
| Too early | "Wait 24 hours before disputing" | "Disputes can only be raised 24 hours after claim" |
| Already disputed | "Dispute already raised" | "This bill is under admin review" |
| Already completed | "Cannot dispute completed bill" | "This bill was already completed successfully" |

---

## Success Messages

### Standard Success Patterns

**1. Action Completed**
```
✓ [Action] completed successfully!
[Details]
[Next steps or CTA]
```

**2. Transaction Confirmed**
```
✓ Transaction confirmed!
Tx Hash: 0xabc...def [View on Etherscan]
[What happened]
```

**3. Waiting State**
```
⏳ [Action] in progress...
[What's happening]
[Expected wait time]
```

**4. Achievement/Milestone**
```
🎉 [Milestone]!
[Celebration message]
[What this means]
[Next steps]
```

---

## Loading States

### Loading Patterns

**1. Button Loading**
```
Before: [Create Bill]
During: [Creating...] ⟳
After:  [Create Bill]
```

**2. Inline Loading**
```
Checking status... ⟳
```

**3. Skeleton Loading**
```
┌─────────────────┐
│ ░░░░░░░░░░░░░░ │
│ ░░░░░ ░░░░░░░░ │
│ ░░░░░░░░░░░░░░ │
└─────────────────┘
```

**4. Progress Bar**
```
Step 1 of 3: Approving USDC
[████████░░░░░░░░] 50%
```

**5. Blockchain Confirmation**
```
Waiting for confirmations...
Block 1 of 3 ✓
Block 2 of 3 ⟳
Block 3 of 3 ...
```

---

## Mobile Responsive Considerations

### Key Adaptations

**1. Navigation**
- Desktop: Horizontal nav bar
- Mobile: Hamburger menu

**2. Forms**
- Desktop: Side-by-side fields
- Mobile: Stacked fields, full width

**3. Bill Cards**
- Desktop: 3-column grid
- Tablet: 2-column grid
- Mobile: 1-column list

**4. Modals**
- Desktop: Center popup (max 600px)
- Mobile: Full-screen slide-up

**5. Tables**
- Desktop: Full table
- Mobile: Card-based view with expandable rows

---

## Accessibility (A11Y)

### Requirements

**1. Keyboard Navigation**
- All actions accessible via Tab/Enter
- Visible focus indicators
- Skip to content link

**2. Screen Readers**
- ARIA labels on all buttons
- Status announcements
- Error announcements

**3. Visual**
- Min contrast ratio 4.5:1
- Text min 16px
- Icons with text labels

**4. Motion**
- Respect prefers-reduced-motion
- No auto-playing animations
- Optional: Disable confetti

---

## Next Steps

### Implementation Priority

**Phase 1: Core Flows (Week 1-2)**
- [ ] Landing page + wallet connection
- [ ] Create bill form + escrow lock
- [ ] Browse bills marketplace
- [ ] Claim bill flow

**Phase 2: Payment & Confirmation (Week 3-4)**
- [ ] Payment instructions page
- [ ] Upload proof (IPFS)
- [ ] Confirm payment + release
- [ ] Transaction complete page

**Phase 3: Edge Cases (Week 5-6)**
- [ ] Cancel bill flow
- [ ] Expire bill auto-refund
- [ ] Dispute system (basic)
- [ ] Admin dashboard

**Phase 4: Polish (Week 7-8)**
- [ ] Mobile responsive
- [ ] Accessibility audit
- [ ] Error handling
- [ ] Loading states
- [ ] Analytics tracking

---

## Design System Reference

### Colors

```css
/* Primary */
--primary: #6366F1;      /* Indigo for CTAs */
--primary-hover: #4F46E5;

/* Status */
--open: #10B981;         /* Green */
--claimed: #F59E0B;      /* Amber */
--completed: #8B5CF6;    /* Purple */
--disputed: #EF4444;     /* Red */
--expired: #6B7280;      /* Gray */

/* UI */
--background: #FFFFFF;
--surface: #F9FAFB;
--border: #E5E7EB;
--text: #111827;
--text-secondary: #6B7280;
```

### Typography

```css
/* Headings */
h1: 2.5rem, 700 weight
h2: 2rem, 600 weight
h3: 1.5rem, 600 weight

/* Body */
body: 1rem, 400 weight
small: 0.875rem, 400 weight

/* Font */
font-family: 'Inter', sans-serif
```

### Spacing

```css
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

### Buttons

```css
/* Primary */
bg: var(--primary)
color: white
padding: 12px 24px
border-radius: 8px
font-weight: 600

/* Secondary */
bg: white
color: var(--primary)
border: 1px solid var(--primary)
```

---

**End of User Flow Design Document**

*This document provides comprehensive guidance for implementing the BillHaven user interface. All flows are designed with security, transparency, and user experience as top priorities.*
