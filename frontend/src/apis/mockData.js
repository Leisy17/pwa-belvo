export const mockInstitutions = [
  {
    id: 'belvo-bank-1',
    name: 'Belvo Bank One',
    internal_name: 'belvo-bank-1',
    country: 'MX',
    type: 'bank',
    link_id: null,
    is_linked: false,
    link_username: null,
    linked_email: null
  },
  {
    id: 'belvo-bank-2',
    name: 'Belvo Bank Two',
    internal_name: 'belvo-bank-2',
    country: 'MX',
    type: 'bank',
    link_id: null,
    is_linked: false,
    link_username: null,
    linked_email: null
  }
];

export const mockAccounts = [
  {
    id: 'acc-001',
    institutionId: 'belvo-bank-1',
    name: 'Checking MXN',
    type: 'checking',
    number: '1234',
    balance: 15600
  },
  {
    id: 'acc-002',
    institutionId: 'belvo-bank-1',
    name: 'Savings MXN',
    type: 'savings',
    number: '5678',
    balance: 8200
  },
  {
    id: 'acc-003',
    institutionId: 'belvo-bank-2',
    name: 'Checking USD',
    type: 'checking',
    number: '8910',
    balance: 4200
  }
];

export const mockSummary = {
  "acc-001": {
    balance: 15600,
    income: 5400,
    expenses: 1200
  },
  "acc-002": {
    balance: 8200,
    income: 2300,
    expenses: 600
  },
  "acc-003": {
    balance: 4200,
    income: 1900,
    expenses: 975
  }
};

export const mockTransactions = {
  "acc-001": [
    {
      id: 'txn-101',
      description: 'Payroll',
      type: 'income',
      amount: 4500,
      currency: 'MXN',
      date: '2024-04-01'
    },
    {
      id: 'txn-102',
      description: 'Groceries',
      type: 'expense',
      amount: 1200,
      currency: 'MXN',
      date: '2024-04-03'
    }
  ],
  "acc-002": [
    {
      id: 'txn-201',
      description: 'Interest',
      type: 'income',
      amount: 200,
      currency: 'MXN',
      date: '2024-04-02'
    }
  ],
  "acc-003": [
    {
      id: 'txn-301',
      description: 'Consulting',
      type: 'income',
      amount: 1100,
      currency: 'USD',
      date: '2024-04-04'
    },
    {
      id: 'txn-302',
      description: 'Rent',
      type: 'expense',
      amount: 975,
      currency: 'USD',
      date: '2024-04-05'
    }
  ]
};
