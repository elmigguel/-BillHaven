# React ErrorBoundary Debugging Guide

## Problem Solved
React app showed ErrorBoundary ("Er is iets misgegaan") on multiple pages after login.

## Root Cause Identified

### Issue 1: WalletProvider Placement
**Location:** `/src/Layout.jsx` and `/src/App.jsx`

**Problem:**
- `WalletProvider` was only wrapping components inside `<Layout>`
- Some pages (MyBills, PublicBills) use `useWallet()` hook
- When navigating after login, components tried to call `useWallet()` before WalletProvider was ready
- This caused: `Cannot read properties of undefined` or `useWallet must be used within WalletProvider`

**Fix:**
- Moved `WalletProvider` to App.jsx (global scope)
- Removed duplicate `WalletProvider` from Layout.jsx
- Now ALL components can safely use `useWallet()`

**Code Structure (AFTER FIX):**
```jsx
// App.jsx
<ErrorBoundary>
  <BrowserRouter>
    <AuthProvider>
      <WalletProvider>  {/* ← Global scope */}
        <Routes>
          <Route path="/my-bills" element={
            <ProtectedRoute>
              <Layout><MyBills /></Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </WalletProvider>
    </AuthProvider>
  </BrowserRouter>
</ErrorBoundary>
```

---

## Enhanced ErrorBoundary

### Changes Made to `/src/components/ErrorBoundary.jsx`

1. **Enhanced Console Logging:**
```jsx
componentDidCatch(error, errorInfo) {
  console.group('🚨 ERROR BOUNDARY TRIGGERED');
  console.error('Error Message:', error.message);
  console.error('Error Stack:', error.stack);
  console.error('Component Stack:', errorInfo.componentStack);
  console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
  console.groupEnd();
}
```

2. **Development vs Production UI:**
- **Development mode:** Shows full error stack, component stack, and detailed error info
- **Production mode:** Shows user-friendly message with collapsible technical details

---

## Debugging Workflow for Future Issues

### Step 1: Check Browser Console
After ErrorBoundary triggers, look for:
```
🚨 ERROR BOUNDARY TRIGGERED
  Error Message: Cannot read properties of undefined (reading 'signer')
  Error Stack: [full stack trace]
  Component Stack: [which component crashed]
```

### Step 2: Identify the Failing Component
The **Component Stack** shows exactly which component threw the error:
```
in MyBills (created by Route)
in Route (created by Routes)
in Routes (created by App)
```
This means: **MyBills component crashed**

### Step 3: Check for Common Patterns

#### Pattern 1: Context Used Outside Provider
```jsx
// ❌ CRASHES
function MyComponent() {
  const { user } = useAuth(); // If called outside AuthProvider
}

// ✅ FIX: Ensure provider wraps the component
<AuthProvider>
  <MyComponent />
</AuthProvider>
```

#### Pattern 2: Null/Undefined Object Access
```jsx
// ❌ CRASHES
const { user } = useAuth();
return <h1>{user.name}</h1>; // user might be null

// ✅ FIX: Guard with optional chaining
return <h1>{user?.name || 'Guest'}</h1>;
```

#### Pattern 3: Missing Loading States
```jsx
// ❌ CRASHES
const { data } = useQuery(...);
return data.items.map(...); // data might be undefined

// ✅ FIX: Add loading check
const { data, isLoading } = useQuery(...);
if (isLoading || !data) return <div>Loading...</div>;
return data.items.map(...);
```

#### Pattern 4: Race Conditions with Auth
```jsx
// ❌ CRASHES
const { user } = useAuth();
useQuery({
  queryKey: ['bills'],
  queryFn: () => billsApi.list(), // Might run before user is loaded
});

// ✅ FIX: Only fetch when user is ready
const { user, loading } = useAuth();
useQuery({
  queryKey: ['bills'],
  queryFn: () => billsApi.list(),
  enabled: !!user && !loading // Wait for auth to complete
});
```

### Step 4: Add Defensive Programming

```jsx
// Always use optional chaining and nullish coalescing
const total = bills?.reduce((sum, b) => sum + (b.amount ?? 0), 0) ?? 0;

// Always check arrays before mapping
{(bills || []).map(bill => <BillCard key={bill.id} bill={bill} />)}

// Always use early returns for loading/error states
if (!user) return <div>Loading user...</div>;
if (error) return <div>Error: {error.message}</div>;
if (!data) return <div>No data</div>;
```

---

## Testing the Fix

1. **Clear browser cache** and reload
2. **Login** to trigger context initialization
3. **Navigate to previously crashing pages:**
   - `/dashboard`
   - `/my-bills`
   - `/public-bills`
4. **Check browser console** for the detailed error logs
5. **If error still occurs:** Look at the console output to see EXACT error message and component stack

---

## Common Error Messages and Solutions

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `useWallet must be used within WalletProvider` | Component using `useWallet()` is outside `<WalletProvider>` | Wrap component tree with WalletProvider in App.jsx |
| `useAuth must be used within AuthProvider` | Component using `useAuth()` is outside `<AuthProvider>` | Wrap component tree with AuthProvider in App.jsx |
| `Cannot read properties of null (reading 'X')` | Accessing property on null/undefined object | Add optional chaining: `obj?.property` |
| `Cannot read properties of undefined (reading 'X')` | Variable is undefined | Add null check or default value |
| `X is not a function` | Function doesn't exist or is undefined | Check if function is defined, add optional chaining: `func?.()` |

---

## Files Modified

1. `/src/components/ErrorBoundary.jsx` - Enhanced error logging and UI
2. `/src/App.jsx` - Added WalletProvider at global scope
3. `/src/Layout.jsx` - Removed duplicate WalletProvider

---

## Quick Reference: Error Boundary Code

```jsx
// To temporarily disable ErrorBoundary (see raw errors in console):
class ErrorBoundary extends React.Component {
  render() {
    return this.props.children; // No catching - errors bubble to console
  }
}

// To add detailed logging without changing UI:
componentDidCatch(error, errorInfo) {
  debugger; // Pause in DevTools
  console.log('Error:', error);
  console.log('Component Stack:', errorInfo.componentStack);
}
```

---

## Next Steps if Errors Persist

1. **Check Network Tab:** Look for failed API calls (401, 404, 500 errors)
2. **Check React DevTools:** Inspect component props/state
3. **Add console.log() statements** in suspect components:
```jsx
function MyBills() {
  console.log('MyBills: Rendering');
  const { user } = useAuth();
  console.log('MyBills: User:', user);
  const { signer } = useWallet();
  console.log('MyBills: Signer:', signer);
  // ... rest of component
}
```

4. **Check for missing dependencies:**
```bash
cd /home/elmigguel/BillHaven
npm install
```

5. **Restart dev server:**
```bash
npm run dev
```
