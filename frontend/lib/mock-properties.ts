export type Property = {
  id: string;
  name: string;
  address: string;
  type: 'Managed Contract' | 'Investor Participation' | 'Settlement Case' | 'Audit Record';
  status:
    | 'Draft'
    | 'Owner confirmation pending'
    | 'Validated'
    | 'Token instrument created'
    | 'Subscription open'
    | 'Funding pending'
    | 'Funded'
    | 'Active'
    | 'Reconciled'
    | 'Closed';
  value: number;
  yield: number;
  occupancy: number;
  image: string;
  acquired: string;
};

export const properties: Property[] = [
  {
    id: 'MPC-001',
    name: 'Managed Apartment Casablanca',
    address: 'Casablanca, Morocco',
    type: 'Managed Contract',
    status: 'Validated',
    value: 120000,
    yield: 50,
    occupancy: 100,
    image:
      'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=600',
    acquired: '2026-06-30',
  },
];
