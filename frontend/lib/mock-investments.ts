export type Investment = {
  id: string;
  holder: string;
  role: 'Owner' | 'Investor';
  contractId: string;
  instrumentId: string;
  units: number;
  upfrontPaid: number;
  expectedReward: number;
  status:
    | 'Approved'
    | 'Subscribed'
    | 'Funding pending'
    | 'Funded'
    | 'Tokens issued'
    | 'Reward pending'
    | 'Paid';
  startDate: string;
  snapshot: string;
};

export const investments: Investment[] = [
  {
    id: 'HLD-001',
    holder: 'Owner retained share',
    role: 'Owner',
    contractId: 'MPC-001',
    instrumentId: 'INSTR-MPC-001',
    units: 500,
    upfrontPaid: 0,
    expectedReward: 38400,
    status: 'Paid',
    startDate: '2026-06-30',
    snapshot: 'End of financial period',
  },
  {
    id: 'HLD-002',
    holder: 'Investor 1',
    role: 'Investor',
    contractId: 'MPC-001',
    instrumentId: 'INSTR-MPC-001',
    units: 300,
    upfrontPaid: 20400,
    expectedReward: 11520,
    status: 'Funded',
    startDate: '2026-06-02',
    snapshot: 'Pending final reconciliation',
  },
  {
    id: 'HLD-003',
    holder: 'Investor 2',
    role: 'Investor',
    contractId: 'MPC-001',
    instrumentId: 'INSTR-MPC-001',
    units: 200,
    upfrontPaid: 13600,
    expectedReward: 7680,
    status: 'Tokens issued',
    startDate: '2026-06-02',
    snapshot: 'Active holding',
  },
  {
    id: 'HLD-004',
    holder: 'Investor 3',
    role: 'Investor',
    contractId: 'MPC-001',
    instrumentId: 'INSTR-MPC-001',
    units: 200,
    upfrontPaid: 13600,
    expectedReward: 7680,
    status: 'Reward pending',
    startDate: '2026-06-02',
    snapshot: 'Waiting on payment confirmation',
  },
];
