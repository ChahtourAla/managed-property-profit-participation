export type Notification = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'success' | 'info' | 'warning' | 'error';
};

export const notifications: Notification[] = [
  {
    id: 'N-1',
    title: 'Final reconciliation recorded',
    description: 'MPC-001 has been reconciled and is ready for reward confirmation.',
    time: '2 min ago',
    read: false,
    type: 'success',
  },
  {
    id: 'N-2',
    title: 'Token instrument created',
    description: 'INSTR-MPC-001 is live for the single managed property POC.',
    time: '1 hour ago',
    read: false,
    type: 'info',
  },
  {
    id: 'N-3',
    title: 'Funding confirmed',
    description: 'Investor upfront funding has been matched with the payment reference.',
    time: '3 hours ago',
    read: false,
    type: 'warning',
  },
  {
    id: 'N-4',
    title: 'Owner confirmation complete',
    description: 'The owner has confirmed the Easycoin-created managed contract record.',
    time: 'Yesterday',
    read: true,
    type: 'error',
  },
  {
    id: 'N-5',
    title: 'Managed contract validated',
    description: 'The contract data and tokenization readiness were approved.',
    time: '2 days ago',
    read: true,
    type: 'success',
  },
];

export type User = {
  name: string;
  email: string;
  role: string;
  initials: string;
};

export const currentUser: User = {
  name: 'Easycoin Admin',
  email: 'easycoin@test.com',
  role: 'EASYCOIN',
  initials: 'EA',
};
