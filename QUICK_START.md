# Bill Haven: Quick Start Guide

Get up and running with Bill Haven in 30 minutes.

---

## Prerequisites

- Node.js 18+ installed
- npm or pnpm
- Supabase account (free tier OK for development)
- MetaMask or Web3 wallet for testing
- Git

---

## Step 1: Clone & Setup (5 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/bill-haven.git
cd bill-haven

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit with your credentials
nano .env.local
```

**Required Environment Variables:**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ETH_RPC_URL=https://eth.drpc.org
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
```

---

## Step 2: Supabase Setup (10 minutes)

### Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Enter project name: `bill-haven-dev`
4. Create a strong database password
5. Select region closest to you
6. Wait for project to initialize (2-3 minutes)

### Get API Keys

1. Go to **Settings** > **API**
2. Copy `URL` to `VITE_SUPABASE_URL`
3. Copy `anon public` key to `VITE_SUPABASE_ANON_KEY`
4. Paste into `.env.local`

### Run Database Schema

1. Open **SQL Editor** in Supabase dashboard
2. Copy all SQL from `/sql/schema.sql`
3. Paste into SQL editor
4. Click **Run** and wait for completion
5. Verify tables appear in **Table Editor**

---

## Step 3: Start Development Server (5 minutes)

```bash
# Start Vite dev server
npm run dev

# Output:
#   VITE v5.0.0  ready in 123 ms
#
#   ➜  Local:   http://localhost:5173/
#   ➜  press h to show help
```

Open browser to `http://localhost:5173`

---

## Step 4: Create Test Account (5 minutes)

1. Click **Sign Up** button
2. Enter test email: `admin@test.com`
3. Enter password: `TestPassword123!`
4. Check email for confirmation link
5. Click confirmation link (will redirect to app)
6. Now logged in as regular user

### Promote to Admin (for testing)

```bash
# Open Supabase > SQL Editor
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@test.com';
```

---

## Step 5: Test Features (5 minutes)

### User Features
- [ ] View dashboard
- [ ] Create a bill
- [ ] Upload a document
- [ ] View bill details

### Admin Features
- [ ] View all bills
- [ ] Approve/reject bills
- [ ] View transaction logs

### Payment Flow (Testnet)
- [ ] Switch MetaMask to Sepolia testnet
- [ ] Get test ETH from [faucet.sepolia.dev](https://faucet.sepolia.dev)
- [ ] Pay a test bill
- [ ] Check transaction status

---

## Directory Structure

```
bill-haven/
├── src/
│   ├── components/       # Reusable React components
│   │   ├── FileUpload.tsx
│   │   ├── BillList.tsx
│   │   ├── PayBillForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/         # React context (auth, etc)
│   │   └── AuthContext.tsx
│   ├── lib/              # Utility functions
│   │   ├── supabaseClient.ts
│   │   ├── transactionService.ts
│   │   ├── storageService.ts
│   │   └── walletValidation.ts
│   ├── pages/            # Full page components
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── CreateBill.tsx
│   │   └── PayBill.tsx
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── sql/
│   ├── schema.sql        # Database schema
│   └── migrations/       # Database migrations
├── .env.example          # Environment template
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── vite.config.ts        # Vite config
```

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server

# Building
npm run build           # Build for production
npm run preview         # Preview production build

# Testing
npm run test            # Run unit tests
npm run test:e2e        # End-to-end tests
npm run test:security   # Security tests

# Linting
npm run lint            # Check code style
npm run lint:fix        # Auto-fix style issues

# Database
supabase db push        # Push schema to Supabase
supabase db pull        # Pull schema from Supabase
supabase db backup create  # Create backup
```

---

## Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js ethers
```

### Error: "VITE_SUPABASE_URL is not defined"
```bash
# Check .env.local exists and has values
cat .env.local

# Make sure file is in root directory (same as package.json)
ls -la .env.local
```

### Error: "User does not have permission"
- Check RLS policies in Supabase
- Verify user role in `profiles` table
- Make sure you're logged in correctly

### MetaMask not connecting
- Install MetaMask browser extension
- Create new wallet or import existing
- Switch to Ethereum mainnet or testnet
- Refresh browser page

### Transactions failing
- Check wallet has sufficient balance
- Verify you're on correct network
- Check gas prices aren't too high
- Try smaller transaction amount

---

## Testing Checklist

### Authentication Flow
```bash
[ ] Sign up with new email
[ ] Verify email confirmation
[ ] Log in with credentials
[ ] Log out
[ ] Forgot password flow
[ ] Session timeout
```

### Bill Management
```bash
[ ] Create bill as user
[ ] View own bills
[ ] Edit draft bill
[ ] Submit bill for approval
[ ] Admin approves bill
[ ] Admin rejects bill with notes
[ ] Approved bill visible to payers
```

### Payment Flow
```bash
[ ] Connect wallet
[ ] View payment instructions
[ ] Pay bill with crypto
[ ] View transaction hash
[ ] Receive confirmation email
[ ] Bill marked as paid
[ ] View transaction history
```

### Admin Functions
```bash
[ ] View all bills
[ ] View all users
[ ] View all transactions
[ ] Download reports
[ ] Update platform settings
[ ] View audit logs
[ ] Export data
```

---

## Next Steps

### Short Term (Week 1)
- [ ] Complete all authentication tests
- [ ] Test all bill creation flows
- [ ] Verify all RLS policies work
- [ ] Test with multiple users

### Medium Term (Week 2-4)
- [ ] Set up production Supabase project
- [ ] Configure custom domain (optional)
- [ ] Set up error tracking (Sentry)
- [ ] Set up analytics (PostHog, Amplitude)
- [ ] Configure CI/CD pipeline (GitHub Actions)

### Long Term (Month 2+)
- [ ] Deploy to production
- [ ] Monitor performance and errors
- [ ] Gather user feedback
- [ ] Implement new features
- [ ] Regular security audits

---

## Documentation

- **Setup Guide**: `SUPABASE_SETUP_GUIDE.md` - Complete database and authentication setup
- **Implementation**: `IMPLEMENTATION_EXAMPLES.md` - Code examples and patterns
- **Deployment**: `DEPLOYMENT_AND_SECURITY.md` - Production readiness
- **API Docs**: Check `src/lib/` for TypeScript documentation

---

## Getting Help

### Resources
- Supabase Docs: https://supabase.com/docs
- Ethers.js: https://docs.ethers.org/
- React Docs: https://react.dev/
- TypeScript: https://www.typescriptlang.org/docs/

### Support Channels
- GitHub Issues: Report bugs
- Discussions: Ask questions
- Email: support@billhaven.app

---

## Key API Endpoints

### Authentication
- `POST /auth/v1/signup` - Create account
- `POST /auth/v1/token?grant_type=password` - Login
- `POST /auth/v1/token?grant_type=refresh_token` - Refresh token
- `POST /auth/v1/logout` - Logout

### Bills
- `GET /rest/v1/bills` - List bills
- `POST /rest/v1/bills` - Create bill
- `GET /rest/v1/bills?id=eq.{id}` - Get bill
- `PATCH /rest/v1/bills?id=eq.{id}` - Update bill

### Transactions
- `GET /rest/v1/transactions` - List transactions
- `POST /rest/v1/transactions` - Create transaction
- `PATCH /rest/v1/transactions?id=eq.{id}` - Update transaction status

### Files
- `POST /storage/v1/object/bill_documents` - Upload file
- `GET /storage/v1/object/bill_documents/{path}` - Download file (with signed URL)

---

## Tips for Success

1. **Test locally first** - Don't skip dev testing
2. **Use TypeScript** - Catches errors before runtime
3. **Write tests** - Unit and E2E tests prevent regressions
4. **Monitor logs** - Set up error tracking early
5. **Backup regularly** - Test restore procedures
6. **Secure secrets** - Never commit API keys
7. **Ask for help** - Community is friendly and helpful

---

## Example: Creating Your First Bill

```typescript
// src/pages/CreateBill.tsx
const handleCreateBill = async () => {
  const { data, error } = await supabase
    .from('bills')
    .insert([{
      user_id: user.id,
      title: 'Q4 Invoice',
      amount: 1000,
      due_date: '2024-12-31',
      preferred_tokens: ['ETH', 'MATIC'],
      status: 'draft'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating bill:', error);
  } else {
    console.log('Bill created:', data.id);
    navigate(`/bills/${data.id}`);
  }
};
```

---

## Example: Paying a Bill

```typescript
// src/components/PayBillForm.tsx
const handlePayBill = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const tx = await signer.sendTransaction({
    to: billData.recipientWallet,
    value: ethers.parseEther(billData.amount.toString())
  });

  // Record transaction
  await supabase.from('transactions').insert({
    bill_id: billData.id,
    payer_id: user.id,
    tx_hash: tx.hash,
    amount_paid: billData.amount,
    token_type: 'ETH',
    status: 'pending'
  });
};
```

---

## Quick Links

- GitHub: https://github.com/yourusername/bill-haven
- Live Demo: https://billhaven.app
- Supabase Project: https://app.supabase.com
- Issues: https://github.com/yourusername/bill-haven/issues
- Discussions: https://github.com/yourusername/bill-haven/discussions

---

## Version

Bill Haven v1.0.0 - Ready for Development

Last Updated: November 2024
