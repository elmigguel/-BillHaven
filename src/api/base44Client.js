// IMPORTANT: This is a MOCK client for demonstration purposes.
// It allows the application to render without errors, but it does not
// connect to a real backend. All data is static and hardcoded.

const mockBills = [
  { id: 1, created_by: 'user@example.com', title: 'Monthly Rent', amount: 1200, status: 'pending', category: 'rent', created_date: new Date().toISOString(), crypto_currency: 'USDT', payout_amount: 1150, fee_amount: 50, fee_percentage: 4.4, crypto_wallet_address: '0x...rent' },
  { id: 2, created_by: 'user@example.com', title: 'Groceries', amount: 150, status: 'approved', category: 'food', created_date: new Date().toISOString(), crypto_currency: 'USDC', payout_amount: 145, fee_amount: 5, fee_percentage: 4.4, crypto_wallet_address: '0x...food' },
  { id: 3, created_by: 'another@example.com', title: 'Electricity Bill', amount: 75, status: 'paid', category: 'utilities', created_date: new Date().toISOString(), crypto_currency: 'ETH', payout_amount: 70, fee_amount: 5, fee_percentage: 4.4, crypto_wallet_address: '0x...utils', transaction_hash: '0x123abc...' },
  { id: 4, created_by: 'user@example.com', title: 'Internet Subscription', amount: 60, status: 'rejected', category: 'utilities', created_date: new Date().toISOString(), crypto_currency: 'USDT', payout_amount: 55, fee_amount: 5, fee_percentage: 4.4, crypto_wallet_address: '0x...inet' },
];

const mockUser = {
  email: 'user@example.com',
  full_name: 'Demo User',
  role: 'admin',
};

const mockSettings = {
  id: 'settings1',
  fee_wallet_address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
  fee_wallet_currency: 'USDT',
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const base44 = {
  auth: {
    me: async () => {
      await sleep(300);
      console.log('MOCK: base44.auth.me()');
      return mockUser;
    },
    logout: () => {
      alert('MOCK: Logging out...');
      window.location.reload();
    },
    redirectToLogin: () => {
      alert('MOCK: Redirecting to login...');
    },
  },
  entities: {
    Bill: {
      list: async () => {
        await sleep(500);
        console.log('MOCK: base44.entities.Bill.list()');
        return mockBills;
      },
      filter: async (filters) => {
        await sleep(500);
        console.log('MOCK: base44.entities.Bill.filter()', filters);
        if (filters.created_by) {
          return mockBills.filter(b => b.created_by === filters.created_by);
        }
        return [];
      },
      create: async (data) => {
        await sleep(1000);
        console.log('MOCK: base44.entities.Bill.create()', data);
        const newBill = { ...data, id: Date.now(), created_date: new Date().toISOString(), created_by: mockUser.email };
        mockBills.push(newBill);
        return newBill;
      },
      update: async (id, data) => {
        await sleep(700);
        console.log('MOCK: base44.entities.Bill.update()', id, data);
        const billIndex = mockBills.findIndex(b => b.id === id);
        if (billIndex !== -1) {
          mockBills[billIndex] = { ...mockBills[billIndex], ...data };
          return mockBills[billIndex];
        }
        return null;
      },
    },
    PlatformSettings: {
      list: async () => {
        await sleep(400);
        console.log('MOCK: base44.entities.PlatformSettings.list()');
        return [mockSettings];
      },
      update: async (id, data) => {
        await sleep(600);
        console.log('MOCK: base44.entities.PlatformSettings.update()', id, data);
        Object.assign(mockSettings, data);
        return mockSettings;
      },
       create: async (data) => {
        await sleep(600);
        console.log('MOCK: base44.entities.PlatformSettings.create()', data);
        Object.assign(mockSettings, data);
        return mockSettings;
      },
    },
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        await sleep(1500);
        console.log('MOCK: base44.integrations.Core.UploadFile()', file.name);
        return { file_url: `https://mockstorage.com/${Date.now()}_${file.name}` };
      },
    },
  },
};