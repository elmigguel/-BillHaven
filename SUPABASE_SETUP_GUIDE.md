# Bill Haven: Comprehensive Supabase Setup Guide

A complete guide for building a secure, scalable cryptocurrency bill payment platform using Supabase.

**Platform Overview:** Bill Haven enables users to submit bills, admins to approve them, and public users to pay bills using Bitcoin, Ethereum, Polygon, and Tron.

---

## Table of Contents

1. [Part 1: Database Schema & Design](#part-1-database-schema--design)
2. [Part 2: Authentication & Authorization](#part-2-authentication--authorization)
3. [Part 3: Web3 Cryptocurrency Integration](#part-3-web3-cryptocurrency-integration)
4. [Part 4: Supabase Storage Setup](#part-4-supabase-storage-setup)
5. [Part 5: Production Deployment](#part-5-production-deployment)
6. [Common Pitfalls & Best Practices](#common-pitfalls--best-practices)

---

## Part 1: Database Schema & Design

### 1.1 Database Architecture Overview

The Bill Haven platform requires the following core entities:

```
Bills (user creates)
  ├── User (bill creator/owner)
  ├── Admin (approver)
  ├── Bill Attachments (documents)
  ├── Transactions (crypto payments)
  └── Platform Settings
```

### 1.2 SQL Schema

#### User Roles Enum

```sql
-- Create a type for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'user', 'payer');
COMMENT ON TYPE public.user_role IS 'User roles: admin (full access), user (bill creator), payer (payment maker)';
```

#### Profiles Table (Extended User Data)

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role public.user_role NOT NULL DEFAULT 'user',
  wallet_address TEXT UNIQUE, -- Primary wallet for payments
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable for wallet lookup" ON public.profiles
  FOR SELECT USING (true); -- Allow wallet verification

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Index for wallet lookups
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address);
```

#### Bills Table

```sql
CREATE TABLE public.bills (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(20, 8) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'paid', 'rejected', 'overdue')),
  payment_method TEXT DEFAULT 'crypto',
    CHECK (payment_method IN ('crypto', 'fiat', 'both')),
  preferred_tokens TEXT[] DEFAULT ARRAY['ETH', 'BTC', 'MATIC', 'TRX'],
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approval_notes TEXT,
  approved_at TIMESTAMPTZ,
  payment_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Bills RLS Policies
CREATE POLICY "Admins can see all bills" ON public.bills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can see their own bills" ON public.bills
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Public can see approved bills (read-only for payment)" ON public.bills
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can create their own bills" ON public.bills
  FOR INSERT WITH CHECK (user_id = auth.uid() AND status = 'draft');

CREATE POLICY "Users can update their own draft bills" ON public.bills
  FOR UPDATE USING (user_id = auth.uid() AND status = 'draft');

CREATE POLICY "Admins can approve/reject bills" ON public.bills
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Indexes for common queries
CREATE INDEX idx_bills_user_id ON public.bills(user_id);
CREATE INDEX idx_bills_status ON public.bills(status);
CREATE INDEX idx_bills_approved_by ON public.bills(approved_by);
CREATE INDEX idx_bills_due_date ON public.bills(due_date);
```

#### Bill Attachments Table

```sql
CREATE TABLE public.bill_attachments (
  id BIGSERIAL PRIMARY KEY,
  bill_id BIGINT NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT NOT NULL,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bill_attachments ENABLE ROW LEVEL SECURITY;

-- Bill Attachments RLS Policies
CREATE POLICY "Bill owner and admins can view attachments" ON public.bill_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bills
      WHERE bills.id = bill_attachments.bill_id
      AND (bills.user_id = auth.uid() OR
           EXISTS (
             SELECT 1 FROM public.profiles
             WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
           ))
    )
  );

CREATE POLICY "Bill owner and admins can upload attachments" ON public.bill_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bills
      WHERE bills.id = bill_attachments.bill_id
      AND (bills.user_id = auth.uid() OR
           EXISTS (
             SELECT 1 FROM public.profiles
             WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
           ))
    )
  );
```

#### Transactions Table (Crypto Payments)

```sql
CREATE TABLE public.transactions (
  id BIGSERIAL PRIMARY KEY,
  bill_id BIGINT NOT NULL REFERENCES public.bills(id) ON DELETE RESTRICT,
  payer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  payer_wallet_address TEXT NOT NULL,
  recipient_wallet_address TEXT NOT NULL,
  tx_hash TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
    CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
  token_type TEXT NOT NULL,
    CHECK (token_type IN ('BTC', 'ETH', 'MATIC', 'TRX', 'USDC', 'USDT')),
  contract_address TEXT, -- For ERC-20 tokens
  amount_paid NUMERIC(20, 8) NOT NULL,
  gas_fee NUMERIC(20, 8),
  exchange_rate NUMERIC(20, 8), -- USD/crypto rate at time of transaction
  usd_equivalent NUMERIC(20, 2),
  block_number BIGINT,
  confirmation_count INT DEFAULT 0,
  network_id INT, -- 1=Ethereum, 137=Polygon, etc
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  notes TEXT
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transactions RLS Policies
CREATE POLICY "Admins can see all transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can see transactions for their bills" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bills
      WHERE bills.id = transactions.bill_id AND bills.user_id = auth.uid()
    )
  );

CREATE POLICY "Payers can see their own transactions" ON public.transactions
  FOR SELECT USING (payer_id = auth.uid());

CREATE POLICY "Authenticated users can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (payer_id = auth.uid());

CREATE POLICY "Only admins can update transaction status" ON public.transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Indexes for common queries
CREATE INDEX idx_transactions_bill_id ON public.transactions(bill_id);
CREATE INDEX idx_transactions_payer_id ON public.transactions(payer_id);
CREATE INDEX idx_transactions_tx_hash ON public.transactions(tx_hash);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
```

#### Platform Settings Table

```sql
CREATE TABLE public.platform_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Platform Settings RLS Policies
CREATE POLICY "Everyone can read settings" ON public.platform_settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update settings" ON public.platform_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Sample settings to insert
INSERT INTO public.platform_settings (setting_key, setting_value, description) VALUES
  ('supported_tokens', '["ETH", "BTC", "MATIC", "TRX"]'::jsonb, 'Supported cryptocurrency tokens'),
  ('payment_timeout_hours', '24'::jsonb, 'Hours until payment deadline expires'),
  ('min_confirmation_blocks', '{"ETH": 12, "BTC": 3, "MATIC": 128, "TRX": 19}'::jsonb, 'Minimum block confirmations per token'),
  ('gas_price_threshold', '{"ETH": "100", "MATIC": "50"}'::jsonb, 'Max acceptable gas price in GWEI'),
  ('platform_fee_percent', '1.5'::jsonb, 'Platform fee as percentage'),
  ('wallet_addresses', '{"ETH": "0x...", "BTC": "bc1...", "MATIC": "0x...", "TRX": "T..."}'::jsonb, 'Platform wallet addresses per token');
```

#### Audit Log Table (For Compliance)

```sql
CREATE TABLE public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id BIGINT,
  changes JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
```

### 1.3 PostgreSQL Functions

#### Get User Role Function

```sql
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE SQL STABLE
AS $$
  SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()
$$;

COMMENT ON FUNCTION public.get_my_role() IS 'Returns the current user role from profiles table';
```

#### Create Profile Trigger

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id,
    new.email,
    'user' -- Default role for new users
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically create profile for new auth users';
```

#### Update Timestamp Function

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

#### Soft Delete Function

```sql
CREATE OR REPLACE FUNCTION public.soft_delete_bill(bill_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.bills
  SET deleted_at = NOW()
  WHERE id = bill_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.soft_delete_bill(BIGINT) IS 'Soft delete a bill (only owner can delete)';
```

### 1.4 Database Design Best Practices

**Key Design Decisions:**

1. **Soft Deletes**: Bills use `deleted_at` for soft deletes (audit trail)
2. **Enums**: Use PostgreSQL enums for `status` and `user_role` (enforces data integrity)
3. **Numeric Type**: `NUMERIC(20, 8)` for crypto amounts (avoids floating-point errors)
4. **Timestamps**: All timestamps are `TIMESTAMPTZ` for timezone safety
5. **Constraints**: CHECK constraints enforce valid states
6. **Indexing**: Indexes on foreign keys and common filter columns
7. **RLS**: Every table has RLS enabled with role-based policies

---

## Part 2: Authentication & Authorization

### 2.1 Authentication Setup Process

#### Step 1: Enable Email Authentication

In your Supabase dashboard:
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates if needed
4. Enable **Confirm email** for security

#### Step 2: Configure JWT Claims

Add this to your Supabase SQL Editor to customize JWT tokens:

```sql
-- This function will be called when issuing JWTs
-- Add role to auth.users metadata so it appears in JWT
CREATE OR REPLACE FUNCTION public.add_role_to_jwt()
RETURNS VOID AS $$
BEGIN
  -- This is handled automatically via the get_my_role() function
  -- in RLS policies. No additional setup needed.
  NULL;
END;
$$ LANGUAGE plpgsql;
```

#### Step 3: Set Up Multi-Factor Authentication (Optional)

```sql
-- Enable MFA for admin users
-- Supabase handles this via UI, but you can enforce it with a policy
CREATE POLICY "Admins must have MFA enabled" ON public.profiles
  FOR SELECT USING (
    CASE
      WHEN role = 'admin' THEN auth.uid() IN (
        SELECT user_id FROM auth.mfa_factors
      )
      ELSE true
    END
  );
```

### 2.2 Frontend Authentication Implementation

#### Initialize Supabase Client (React)

Create `/src/lib/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Database = any; // Generate from Supabase CLI
```

#### Create AuthContext (React)

Create `/src/contexts/AuthContext.tsx`:

```typescript
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export type UserRole = 'admin' | 'user' | 'payer';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { full_name?: string; wallet_address?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setSession(session);
        setUser(session.user);
        await fetchUserRole();
      }

      setLoading(false);
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserRole();
        } else {
          setRole(null);
        }

        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data: userRole, error } = await supabase.rpc('get_my_role');
      if (error) throw error;
      setRole(userRole as UserRole);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setRole(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateProfile = async (
    data: { full_name?: string; wallet_address?: string }
  ) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    role,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

#### Protected Route Component

Create `/src/components/ProtectedRoute.tsx`:

```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({
  children,
  allowedRoles,
}: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

#### Wallet Authentication (Web3)

Create `/src/lib/walletAuth.ts`:

```typescript
import { supabase } from '@/lib/supabaseClient';
import { ethers } from 'ethers';

interface SignInMessage {
  address: string;
  nonce: string;
  statement: string;
  timestamp: number;
  chainId: number;
}

// Generate a nonce for the user to sign
export const generateNonce = async (address: string): Promise<string> => {
  const nonce = Math.random().toString(36).substring(2, 15);

  // Store nonce in profiles table with expiration (5 minutes)
  await supabase
    .from('profiles')
    .update({
      wallet_nonce: nonce,
      wallet_nonce_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })
    .eq('wallet_address', address);

  return nonce;
};

// Sign message with wallet
export const signMessageWithWallet = async (
  message: string
): Promise<string> => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const signature = await signer.signMessage(message);

  return signature;
};

// Verify signature and create session
export const authenticateWithWallet = async (
  address: string,
  signature: string,
  nonce: string
): Promise<void> => {
  try {
    // Verify the signature (backend should do this in production)
    const recoveredAddress = ethers.verifyMessage(
      `Sign in to Bill Haven\nNonce: ${nonce}`,
      signature
    );

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      throw new Error('Signature verification failed');
    }

    // Check nonce expiration
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('wallet_nonce_expires_at')
      .eq('wallet_address', address)
      .single();

    if (error || !profile) {
      throw new Error('Profile not found');
    }

    const expiresAt = new Date(profile.wallet_nonce_expires_at);
    if (expiresAt < new Date()) {
      throw new Error('Nonce expired');
    }

    // TODO: Create custom JWT or use custom auth flow
    // This is a simplified example
    alert('Authentication successful! (Backend JWT generation needed)');
  } catch (error) {
    console.error('Wallet authentication error:', error);
    throw error;
  }
};

// Connect wallet
export const connectWallet = async (): Promise<string> => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    return accounts[0];
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};
```

---

## Part 3: Web3 Cryptocurrency Integration

### 3.1 Blockchain Configuration

Create `/src/lib/blockchainConfig.ts`:

```typescript
export interface BlockchainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  currency: string;
  minConfirmations: number;
  gasLimit?: number;
}

export const BLOCKCHAIN_CONFIG: Record<string, BlockchainConfig> = {
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: import.meta.env.VITE_ETH_RPC_URL || 'https://eth.drpc.org',
    explorerUrl: 'https://etherscan.io',
    currency: 'ETH',
    minConfirmations: 12,
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    currency: 'MATIC',
    minConfirmations: 128,
  },
  bitcoin: {
    name: 'Bitcoin',
    chainId: 0, // Not applicable
    rpcUrl: import.meta.env.VITE_BITCOIN_RPC_URL || '',
    explorerUrl: 'https://mempool.space',
    currency: 'BTC',
    minConfirmations: 3,
  },
  tron: {
    name: 'TRON',
    chainId: 0, // Not applicable
    rpcUrl: import.meta.env.VITE_TRON_RPC_URL || 'https://api.trongrid.io',
    explorerUrl: 'https://tronscan.org',
    currency: 'TRX',
    minConfirmations: 19,
  },
};

export const TOKEN_TYPES = ['BTC', 'ETH', 'MATIC', 'TRX', 'USDC', 'USDT'];

export interface TokenConfig {
  symbol: string;
  name: string;
  decimals: number;
  contractAddress?: string; // For ERC-20 tokens
  blockchain: keyof typeof BLOCKCHAIN_CONFIG;
}

export const TOKEN_CONFIG: Record<string, TokenConfig> = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    decimals: 8,
    blockchain: 'bitcoin',
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    blockchain: 'ethereum',
  },
  MATIC: {
    symbol: 'MATIC',
    name: 'Polygon',
    decimals: 18,
    blockchain: 'polygon',
  },
  TRX: {
    symbol: 'TRX',
    name: 'TRON',
    decimals: 6,
    blockchain: 'tron',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    blockchain: 'ethereum',
  },
};
```

### 3.2 Transaction Management Service

Create `/src/lib/transactionService.ts`:

```typescript
import { supabase } from '@/lib/supabaseClient';
import { ethers } from 'ethers';
import type { BLOCKCHAIN_CONFIG } from '@/lib/blockchainConfig';

export interface CreateTransactionInput {
  billId: number;
  payerId: string;
  payerWalletAddress: string;
  recipientWalletAddress: string;
  amount: number;
  tokenType: string;
  txHash: string;
  networkId: number;
}

export interface TransactionStatus {
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  confirmationCount: number;
  blockNumber?: number;
}

// Create a new transaction record
export const createTransaction = async (
  input: CreateTransactionInput
) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          bill_id: input.billId,
          payer_id: input.payerId,
          payer_wallet_address: input.payerWalletAddress,
          recipient_wallet_address: input.recipientWalletAddress,
          tx_hash: input.txHash,
          status: 'pending',
          token_type: input.tokenType,
          amount_paid: input.amount,
          network_id: input.networkId,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

// Get transaction status
export const getTransactionStatus = async (
  txHash: string,
  rpcUrl: string
): Promise<TransactionStatus> => {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return {
        status: 'pending',
        confirmationCount: 0,
      };
    }

    const currentBlock = await provider.getBlockNumber();
    const confirmationCount = currentBlock - receipt.blockNumber;

    const status = receipt.status === 1 ? 'confirmed' : 'failed';

    return {
      status: status as 'confirmed' | 'failed',
      confirmationCount,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error('Error getting transaction status:', error);
    throw error;
  }
};

// Update transaction status in database
export const updateTransactionStatus = async (
  txHash: string,
  status: 'pending' | 'confirmed' | 'failed',
  confirmationCount: number,
  blockNumber?: number
) => {
  try {
    const updates: Record<string, any> = {
      status,
      confirmation_count: confirmationCount,
    };

    if (status === 'confirmed') {
      updates.confirmed_at = new Date().toISOString();
    }

    if (blockNumber) {
      updates.block_number = blockNumber;
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('tx_hash', txHash)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }
};

// Mark bill as paid when transaction is confirmed
export const markBillAsPaid = async (billId: number) => {
  try {
    const { data, error } = await supabase
      .from('bills')
      .update({ status: 'paid' })
      .eq('id', billId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error marking bill as paid:', error);
    throw error;
  }
};

// Get pending transactions that need status check
export const getPendingTransactions = async () => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 1 * 60000).toISOString()); // Older than 1 minute

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching pending transactions:', error);
    throw error;
  }
};
```

### 3.3 Security Best Practices for Crypto Data

**CRITICAL SECURITY WARNINGS:**

1. **NEVER store private keys** - Users should sign transactions locally in their wallet
2. **NEVER ask for seed phrases** - Only verify public addresses
3. **Always validate wallet addresses** - Check format and checksum
4. **Verify signatures independently** - Don't trust client-side validation
5. **Rate limit crypto endpoints** - Prevent abuse
6. **Audit all transactions** - Log every crypto operation

#### Validation Service

Create `/src/lib/walletValidation.ts`:

```typescript
import { ethers } from 'ethers';

// Validate Ethereum/ERC-20 address
export const isValidEthereumAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

// Validate Bitcoin address (basic check)
export const isValidBitcoinAddress = (address: string): boolean => {
  // P2PKH addresses start with 1
  // P2SH addresses start with 3
  // Bech32 addresses start with bc1
  const p2pkhRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const bech32Regex = /^bc1[a-z0-9]{39,59}$/;
  return p2pkhRegex.test(address) || bech32Regex.test(address);
};

// Validate TRON address
export const isValidTronAddress = (address: string): boolean => {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
};

// Generic address validator
export const isValidAddress = (
  address: string,
  tokenType: string
): boolean => {
  switch (tokenType.toUpperCase()) {
    case 'BTC':
      return isValidBitcoinAddress(address);
    case 'ETH':
    case 'USDC':
    case 'USDT':
    case 'MATIC':
      return isValidEthereumAddress(address);
    case 'TRX':
      return isValidTronAddress(address);
    default:
      return false;
  }
};

// Get address checksum (for EVM chains)
export const getAddressChecksum = (address: string): string => {
  try {
    return ethers.getAddress(address);
  } catch {
    throw new Error('Invalid address');
  }
};

// Prevent replay attacks with nonces
export const generateTransactionNonce = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Verify message signature (EIP-191)
export const verifySignature = (
  message: string,
  signature: string,
  address: string
): boolean => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
};
```

---

## Part 4: Supabase Storage Setup

### 4.1 Storage Bucket Configuration

#### Create Bill Documents Bucket

In Supabase dashboard → **Storage**:

```sql
-- SQL to create bucket (for reference)
INSERT INTO storage.buckets (id, name, public)
VALUES ('bill_documents', 'bill_documents', false);

-- Create RLS policies for bill_documents bucket
CREATE POLICY "Users can upload their own bill documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'bill_documents'
  AND auth.uid() = (storage.foldername(name))[1]::uuid
);

CREATE POLICY "Bill owners and admins can download documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'bill_documents'
  AND (
    auth.uid() = (storage.foldername(name))[1]::uuid
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'bill_documents'
  AND auth.uid() = (storage.foldername(name))[1]::uuid
);
```

### 4.2 File Upload Service

Create `/src/lib/storageService.ts`:

```typescript
import { supabase } from '@/lib/supabaseClient';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadedFile {
  name: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
}

// Validate file before upload
export const validateFile = (file: File): void => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      'File type not allowed. Allowed types: PDF, JPG, PNG, WEBP, DOC, DOCX'
    );
  }

  // Validate file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions: Record<string, string[]> = {
    'application/pdf': ['pdf'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'application/msword': ['doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      'docx',
    ],
  };

  const allowedExts = validExtensions[file.type] || [];
  if (!allowedExts.includes(extension || '')) {
    throw new Error('File extension does not match file type');
  }
};

// Upload file to storage
export const uploadFile = async (
  file: File,
  userId: string,
  billId: number
): Promise<UploadedFile> => {
  try {
    validateFile(file);

    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${userId}/${billId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('bill_documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get signed URL (valid for 24 hours)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('bill_documents')
      .createSignedUrl(filePath, 60 * 60 * 24);

    if (urlError) throw urlError;

    return {
      name: file.name,
      path: filePath,
      url: signedUrl.signedUrl,
      size: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

// Create bill attachment record
export const createBillAttachment = async (
  billId: number,
  fileName: string,
  filePath: string,
  fileSize: number,
  mimeType: string,
  userId: string
) => {
  try {
    const { data, error } = await supabase
      .from('bill_attachments')
      .insert([
        {
          bill_id: billId,
          file_name: fileName,
          file_path: filePath,
          file_size: fileSize,
          mime_type: mimeType,
          uploaded_by: userId,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating bill attachment record:', error);
    throw error;
  }
};

// Get signed URL for file download
export const getSignedUrl = async (filePath: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('bill_documents')
      .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
};

// Delete file
export const deleteFile = async (filePath: string) => {
  try {
    const { error } = await supabase.storage
      .from('bill_documents')
      .remove([filePath]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
```

### 4.3 React File Upload Component

Create `/src/components/FileUpload.tsx`:

```typescript
import { useState } from 'react';
import { uploadFile, createBillAttachment } from '@/lib/storageService';
import { useAuth } from '@/contexts/AuthContext';

interface FileUploadProps {
  billId: number;
  onUploadComplete?: () => void;
}

export const FileUpload = ({ billId, onUploadComplete }: FileUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  if (!user) return null;

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setError(null);
      setUploading(true);

      // Upload file to storage
      const uploadedFile = await uploadFile(file, user.id, billId);

      // Create attachment record in database
      await createBillAttachment(
        billId,
        uploadedFile.name,
        uploadedFile.path,
        uploadedFile.size,
        uploadedFile.mimeType,
        user.id
      );

      onUploadComplete?.();
      setProgress(100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setProgress(0);
      // Reset input
      event.target.value = '';
    }
  };

  return (
    <div className="file-upload">
      <label htmlFor="file-input" className="block mb-2">
        Upload Bill Document
      </label>

      <input
        id="file-input"
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
        className="block w-full"
      />

      {uploading && (
        <div className="mt-4">
          <div className="progress-bar">
            <div style={{ width: `${progress}%` }} className="progress-fill">
              {progress}%
            </div>
          </div>
        </div>
      )}

      {error && <div className="mt-2 text-red-600">{error}</div>}
    </div>
  );
};
```

---

## Part 5: Production Deployment

### 5.1 Environment Configuration

Create `.env.example`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Blockchain RPC URLs
VITE_ETH_RPC_URL=https://eth.drpc.org
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
VITE_BITCOIN_RPC_URL=https://api.blockchain.com
VITE_TRON_RPC_URL=https://api.trongrid.io

# API Keys (for transaction verification services)
VITE_ETHERSCAN_API_KEY=
VITE_POLYGONSCAN_API_KEY=

# Application Configuration
VITE_APP_URL=https://billhaven.app
VITE_SUPPORT_EMAIL=support@billhaven.app

# Feature Flags
VITE_ENABLE_TESTNET=false
VITE_ENABLE_PAPER_TRADING=true
```

### 5.2 Database Connection Pooling

Create `/src/server/config/database.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export default supabaseAdmin;
```

### 5.3 Database Backup Strategy

**Automated Backups:**

1. Enable **Point-in-Time Recovery (PITR)** in Supabase dashboard
2. Set retention to 7 days minimum
3. Schedule manual backups weekly

**SQL Backup Script** (`backup.sql`):

```bash
#!/bin/bash
# Monthly database backup script

BACKUP_DIR="/backups/billhaven"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/billhaven_$DATE.sql"

mkdir -p "$BACKUP_DIR"

# Backup using Supabase CLI
supabase db pull > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Upload to S3
aws s3 cp "$BACKUP_FILE.gz" "s3://billhaven-backups/"

# Cleanup old backups (keep 3 months)
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +90 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### 5.4 Monitoring & Alerting

**Key Metrics to Monitor:**

```typescript
// src/server/monitoring.ts

import { supabase } from '@/lib/supabaseClient';

export const monitoringMetrics = {
  // Database metrics
  'database.connections': 'Number of active connections',
  'database.query_time': 'Average query execution time',
  'database.cache_hit_ratio': 'Cache hit ratio',
  'database.dead_tuples': 'Dead tuples (vacuum indicator)',

  // Application metrics
  'transactions.pending_count': 'Pending crypto transactions',
  'transactions.failed_rate': 'Failed transaction percentage',
  'bills.pending_approval': 'Bills awaiting approval',
  'auth.failed_logins': 'Failed login attempts',

  // Storage metrics
  'storage.usage_bytes': 'Total storage usage',
  'storage.bandwidth_bytes': 'Monthly bandwidth usage',
};

// Alert thresholds
export const alertThresholds = {
  db_connections_critical: 90, // % of max
  avg_query_time_warning: 500, // milliseconds
  failed_transaction_rate: 5, // %
  pending_bills_warning: 100,
  failed_login_rate: 10, // per minute
};
```

### 5.5 Security Hardening Checklist

```markdown
## Production Security Checklist

### Database Security
- [ ] Enable SSL/TLS for all connections
- [ ] Use service role key only on server-side
- [ ] Enable RLS on all tables
- [ ] Set up database activity monitoring
- [ ] Configure backup encryption
- [ ] Restrict database access by IP (if possible)

### Application Security
- [ ] Enable CORS with specific origins only
- [ ] Implement rate limiting (1000 req/min per IP)
- [ ] Enable CSRF protection
- [ ] Implement content security policies
- [ ] Set up DDoS protection (Cloudflare)
- [ ] Enable Web Application Firewall (WAF)

### Authentication Security
- [ ] Enforce HTTPS everywhere
- [ ] Enable MFA for admin users
- [ ] Set secure session timeout (30 min)
- [ ] Implement password complexity requirements
- [ ] Add email verification
- [ ] Enable suspicious login detection

### Crypto Security
- [ ] Validate all wallet addresses
- [ ] Implement transaction replay attack prevention
- [ ] Use hardware wallet for platform addresses
- [ ] Enable transaction amount limits
- [ ] Set up real-time fraud monitoring
- [ ] Implement audit logging for all crypto ops

### Compliance
- [ ] Enable GDPR data deletion
- [ ] Implement audit trails
- [ ] Set data retention policies
- [ ] Enable encryption at rest
- [ ] Regular security audits
- [ ] Compliance monitoring logs

### Infrastructure
- [ ] Enable WAF rules
- [ ] Set up VPN for admin access
- [ ] Use secrets manager for API keys
- [ ] Enable API key rotation
- [ ] Regular dependency updates
- [ ] Security patch management
```

---

## Common Pitfalls & Best Practices

### Critical Mistakes to Avoid

#### 1. **Storing Private Keys**
```typescript
// WRONG - NEVER DO THIS
const storePrivateKey = (key: string) => {
  supabase.from('wallets').insert({ private_key: key });
};

// CORRECT - Let users sign in their wallet
const connectWallet = async () => {
  const signer = await ethers.getSigner();
  // User signs transactions client-side only
};
```

#### 2. **Trusting Client-Side Validation**
```typescript
// WRONG
const submitPayment = (amount: string) => {
  if (Number(amount) > 0) { // Client validation only
    processPayment(amount);
  }
};

// CORRECT
const submitPayment = async (amount: string) => {
  // Server-side validation
  const { data: bill, error } = await supabase.rpc('validate_payment', {
    bill_id: billId,
    amount: parseFloat(amount),
  });
};
```

#### 3. **Missing Error Handling**
```typescript
// WRONG
const fetchBills = async () => {
  const data = await supabase.from('bills').select();
  return data; // No error handling
};

// CORRECT
const fetchBills = async () => {
  try {
    const { data, error } = await supabase.from('bills').select();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching bills:', error);
    throw error; // Let caller handle
  }
};
```

### Best Practices

#### 1. **Rate Limiting Crypto Operations**
```typescript
// Implement rate limiting on transaction submissions
const rateLimiter = new Map<string, number[]>();

export const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const timestamps = rateLimiter.get(userId) || [];

  // Remove timestamps older than 1 minute
  const recent = timestamps.filter(t => now - t < 60000);

  if (recent.length >= 10) { // Max 10 per minute
    return false;
  }

  recent.push(now);
  rateLimiter.set(userId, recent);
  return true;
};
```

#### 2. **Comprehensive Logging**
```typescript
// Log all sensitive operations
const logCryptoOperation = async (
  userId: string,
  action: string,
  details: Record<string, any>
) => {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    changes: details,
    ip_address: getClientIp(),
    created_at: new Date().toISOString(),
  });
};
```

#### 3. **Monitoring Performance**
```typescript
// Track query performance
const queryWithMonitoring = async (query: Promise<any>, label: string) => {
  const start = performance.now();
  try {
    const result = await query;
    const duration = performance.now() - start;
    console.log(`${label} took ${duration}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`${label} failed after ${duration}ms:`, error);
    throw error;
  }
};
```

---

## Quick Reference: Environment Setup

### 1. Create Supabase Project
```bash
# Using Supabase CLI
supabase init
supabase projects create --name bill-haven
```

### 2. Run Database Schema
```bash
# Copy all SQL from Part 1 into Supabase SQL Editor
# Or use CLI
supabase db push
```

### 3. Configure Authentication
- Enable Email/Password in Auth Settings
- Configure email templates
- Set redirect URLs

### 4. Initialize React Project
```bash
npm create vite@latest billhaven -- --template react-ts
cd billhaven
npm install @supabase/supabase-js ethers axios
npm install -D tailwindcss postcss autoprefixer
```

### 5. Setup Environment Variables
```bash
cp .env.example .env.local
# Update with your Supabase credentials
```

### 6. Create Core Files
```
src/
├── lib/
│   ├── supabaseClient.ts
│   ├── blockchainConfig.ts
│   ├── transactionService.ts
│   ├── storageService.ts
│   └── walletValidation.ts
├── contexts/
│   └── AuthContext.tsx
├── components/
│   ├── ProtectedRoute.tsx
│   └── FileUpload.tsx
└── pages/
    ├── Login.tsx
    ├── Dashboard.tsx
    ├── CreateBill.tsx
    └── PayBill.tsx
```

---

## Summary

Bill Haven uses Supabase to provide:

1. **Secure Authentication**: Email/password + optional Web3 wallet auth
2. **Role-Based Access Control**: Admin, User, and Payer roles with RLS
3. **Cryptocurrency Payments**: Support for BTC, ETH, MATIC, TRX
4. **Document Storage**: Encrypted bill attachments in Supabase Storage
5. **Transaction Tracking**: Complete audit trail of all payments
6. **Production Ready**: Connection pooling, backups, monitoring, and alerting

Follow this guide to build a secure, compliant crypto bill payment platform.

---

## Additional Resources

- Supabase Docs: https://supabase.com/docs
- Ethers.js Docs: https://docs.ethers.org/
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Web3 Best Practices: https://ethereum.org/en/developers/docs/smart-contracts/security/
