export type Transaction = {
  id: string;
  reference: string;
  description: string;
  type:
    | 'Submission'
    | 'Validation'
    | 'Instrument'
    | 'Subscription'
    | 'Funding'
    | 'Report'
    | 'Reconciliation'
    | 'Reward'
    | 'Payment'
    | 'Closure'
    | 'Redemption';
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed' | 'Processing';
  date: string;
  method: 'Canton' | 'Bank Transfer' | 'Backend' | 'Manual review';
};

export const transactions: Transaction[] = [
  {
    id: 'EVT-0001',
    reference: 'MPC-001-DRAFT',
    description: 'Managed contract draft created',
    type: 'Submission',
    amount: 0,
    status: 'Completed',
    date: '2026-06-01',
    method: 'Backend',
  },
  {
    id: 'EVT-0002',
    reference: 'MPC-001-VALIDATED',
    description: 'Managed contract validated by Easycoin',
    type: 'Validation',
    amount: 0,
    status: 'Completed',
    date: '2026-06-01',
    method: 'Canton',
  },
  {
    id: 'EVT-0003',
    reference: 'INSTR-MPC-001',
    description: 'Tokenized instrument created for profit participation',
    type: 'Instrument',
    amount: 0,
    status: 'Completed',
    date: '2026-06-01',
    method: 'Canton',
  },
  {
    id: 'EVT-0004',
    reference: 'SUB-INV-001',
    description: 'Investor subscription request submitted',
    type: 'Subscription',
    amount: 34000,
    status: 'Completed',
    date: '2026-06-02',
    method: 'Bank Transfer',
  },
  {
    id: 'EVT-0005',
    reference: 'FUND-INV-001',
    description: 'Upfront funding confirmed by payment verifier',
    type: 'Funding',
    amount: 34000,
    status: 'Completed',
    date: '2026-06-03',
    method: 'Canton',
  },
  {
    id: 'EVT-0006',
    reference: 'RPT-2026-Q3',
    description: 'Performance report recorded with report hash',
    type: 'Report',
    amount: 0,
    status: 'Completed',
    date: '2026-06-30',
    method: 'Backend',
  },
  {
    id: 'EVT-0007',
    reference: 'REC-2026-Q3',
    description: 'Final reconciliation calculated and recorded',
    type: 'Reconciliation',
    amount: 0,
    status: 'Completed',
    date: '2026-07-10',
    method: 'Backend',
  },
  {
    id: 'EVT-0008',
    reference: 'REWARD-INV-001',
    description: 'Reward record created for investor 1',
    type: 'Reward',
    amount: 11520,
    status: 'Completed',
    date: '2026-07-10',
    method: 'Canton',
  },
  {
    id: 'EVT-0009',
    reference: 'PAY-REWARD-INV-001',
    description: 'Reward payment confirmed by payment verifier',
    type: 'Payment',
    amount: 11520,
    status: 'Completed',
    date: '2026-07-11',
    method: 'Bank Transfer',
  },
  {
    id: 'EVT-0010',
    reference: 'CLS-REC-2026-Q3',
    description: 'Managed contract closed after settlement',
    type: 'Closure',
    status: 'Completed',
    amount: 0,
    date: '2026-07-15',
    method: 'Canton',
  },
  {
    id: 'EVT-0011',
    reference: 'BURN-INSTR-MPC-001',
    description: 'Tokens redeemed and burned at contract close',
    type: 'Redemption',
    amount: 0,
    status: 'Completed',
    date: '2026-07-12',
    method: 'Canton',
  },
];
