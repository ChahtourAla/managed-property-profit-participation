export type Stat = {
  id: string;
  label: string;
  value: string;
  delta: number;
  trend: 'up' | 'down';
  series: { label: string; value: number }[];
  icon: 'dollar' | 'building' | 'trending' | 'users';
};

export const stats: Stat[] = [
  {
    id: 'contract',
    label: 'Managed contract',
    value: 'MPC-001',
    delta: 0,
    trend: 'up',
    icon: 'building',
    series: [
      { label: 'Draft', value: 20 },
      { label: 'Review', value: 35 },
      { label: 'Validated', value: 55 },
      { label: 'Instrument', value: 68 },
      { label: 'Funding', value: 82 },
      { label: 'Closed', value: 100 },
    ],
  },
  {
    id: 'investors',
    label: 'Approved investors',
    value: '3',
    delta: 0,
    trend: 'up',
    icon: 'users',
    series: [
      { label: 'Step 1', value: 1 },
      { label: 'Step 2', value: 1 },
      { label: 'Step 3', value: 2 },
      { label: 'Step 4', value: 2 },
      { label: 'Step 5', value: 3 },
      { label: 'Step 6', value: 3 },
    ],
  },
  {
    id: 'funding',
    label: 'Upfront funding',
    value: 'MAD 34K',
    delta: 0,
    trend: 'up',
    icon: 'dollar',
    series: [
      { label: 'Draft', value: 10 },
      { label: 'Validated', value: 18 },
      { label: 'Approved', value: 24 },
      { label: 'Subscribed', value: 28 },
      { label: 'Funded', value: 32 },
      { label: 'Confirmed', value: 34 },
    ],
  },
  {
    id: 'settlement',
    label: 'Expected settlement',
    value: 'MAD 38.4K',
    delta: 0,
    trend: 'up',
    icon: 'trending',
    series: [
      { label: 'Income', value: 120 },
      { label: 'Expenses', value: 96 },
      { label: 'Fee', value: 76 },
      { label: 'Investor', value: 38.4 },
      { label: 'Owner', value: 38.4 },
      { label: 'Closed', value: 38.4 },
    ],
  },
];

export type RevenuePoint = {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
};

export const revenueData: RevenuePoint[] = [
  { month: 'Jan', revenue: 18000, expenses: 3600, profit: 14400 },
  { month: 'Feb', revenue: 20000, expenses: 4000, profit: 16000 },
  { month: 'Mar', revenue: 21000, expenses: 4200, profit: 16800 },
  { month: 'Apr', revenue: 19500, expenses: 3900, profit: 15600 },
  { month: 'May', revenue: 22000, expenses: 4400, profit: 17600 },
  { month: 'Jun', revenue: 19500, expenses: 3900, profit: 15600 },
];

export type AllocationSlice = {
  name: string;
  value: number;
  color: string;
};

export const portfolioAllocation: AllocationSlice[] = [
  { name: 'Investor reward pool', value: 50, color: 'hsl(var(--chart-1))' },
  { name: 'Owner retained', value: 30, color: 'hsl(var(--chart-2))' },
  { name: 'EasyCoin fee', value: 20, color: 'hsl(var(--chart-3))' },
  { name: 'Reserve', value: 0, color: 'hsl(var(--chart-4))' },
];
