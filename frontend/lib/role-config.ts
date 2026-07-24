import {
  Building2,
  Coins,
  FileText,
  Landmark,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export type AppRole =
  | 'OWNER'
  | 'EASYCOIN'
  | 'INVESTOR'
  | 'AUDITOR'
  | 'PAYMENT_VERIFIER'
  | 'LEGAL_ADMIN'
  | 'ADMIN';

export const appRoles: AppRole[] = [
  'OWNER',
  'EASYCOIN',
  'INVESTOR',
  'AUDITOR',
  'PAYMENT_VERIFIER',
  'LEGAL_ADMIN',
  'ADMIN',
];

export type DemoUser = {
  role: AppRole;
  name: string;
  email: string;
  initials: string;
  partyId: string;
};

export const demoUsers: Record<AppRole, DemoUser> = {
  OWNER: {
    role: 'OWNER',
    name: 'Owner Demo',
    email: 'owner@test.com',
    initials: 'OW',
    partyId: 'Party::OWNER',
  },
  EASYCOIN: {
    role: 'EASYCOIN',
    name: 'Easycoin Admin',
    email: 'easycoin@test.com',
    initials: 'EA',
    partyId: 'Party::EASYCOIN',
  },
  INVESTOR: {
    role: 'INVESTOR',
    name: 'Investor Demo',
    email: 'investor1@test.com',
    initials: 'IN',
    partyId: 'Party::INVESTOR',
  },
  AUDITOR: {
    role: 'AUDITOR',
    name: 'Auditor Demo',
    email: 'auditor@test.com',
    initials: 'AU',
    partyId: 'Party::AUDITOR',
  },
  PAYMENT_VERIFIER: {
    role: 'PAYMENT_VERIFIER',
    name: 'Payment Verifier',
    email: 'paymentverifier@test.com',
    initials: 'PV',
    partyId: 'Party::PAYMENT_VERIFIER',
  },
  LEGAL_ADMIN: {
    role: 'LEGAL_ADMIN',
    name: 'Legal Admin',
    email: 'legaladmin@test.com',
    initials: 'LA',
    partyId: 'Party::LEGAL_ADMIN',
  },
  ADMIN: {
    role: 'ADMIN',
    name: 'Platform Admin',
    email: 'admin@test.com',
    initials: 'AD',
    partyId: 'Party::ADMIN',
  },
};

export type RoleSection = {
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  icon: LucideIcon;
};

export type RoleProfile = {
  title: string;
  tagline: string;
  summary: string;
  badge: string;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  sections: RoleSection[];
};

export const roleProfiles: Record<AppRole, RoleProfile> = {
  OWNER: {
    title: 'Owner workspace',
    tagline: 'Submit and follow the managed contract draft.',
    summary:
      'The owner creates or confirms the contract record and tracks liquidity, retained share, and closure.',
    badge: 'Owner view',
    primaryAction: { label: 'Open contract draft', href: '/dashboard/properties' },
    secondaryAction: { label: 'View holdings', href: '/dashboard/investments' },
    sections: [
      {
        title: 'Contract draft',
        description: 'Create or confirm the managed property case.',
        actionLabel: 'Open draft',
        href: '/dashboard/properties',
        icon: Building2,
      },
      {
        title: 'Ownership view',
        description: 'See upfront liquidity, retained profit, and final payout.',
        actionLabel: 'View holdings',
        href: '/dashboard/investments',
        icon: Wallet,
      },
    ],
  },
  EASYCOIN: {
    title: 'Easycoin operations',
    tagline: 'Run the full workflow from validation to burn.',
    summary:
      'Easycoin validates the case, creates the token instrument, tracks performance, and closes settlement.',
    badge: 'Operator view',
    primaryAction: { label: 'Review the contract', href: '/dashboard/properties' },
    secondaryAction: { label: 'Launch settlement', href: '/dashboard/reports' },
    sections: [
      {
        title: 'Validation',
        description: 'Validate the owner or Easycoin-submitted managed contract.',
        actionLabel: 'Review draft',
        href: '/dashboard/properties',
        icon: ShieldCheck,
      },
      {
        title: 'Token setup',
        description: 'Create the tokenized instrument and investor supply.',
        actionLabel: 'Create instrument',
        href: '/dashboard/investments',
        icon: Coins,
      },
      {
        title: 'Settlement',
        description: 'Compute final reconciliation, rewards, and closure.',
        actionLabel: 'Open settlement',
        href: '/dashboard/reports',
        icon: FileText,
      },
    ],
  },
  INVESTOR: {
    title: 'Investor workspace',
    tagline: 'Subscribe, track holdings, and follow expected rewards.',
    summary:
      'Investors see the available participation instrument, their holdings, and the final reward path.',
    badge: 'Investor view',
    primaryAction: { label: 'Browse instruments', href: '/dashboard/investments' },
    secondaryAction: { label: 'Review rewards', href: '/dashboard/reports' },
    sections: [
      {
        title: 'Available instrument',
        description: 'Review the tokenized profit participation opportunity.',
        actionLabel: 'Open instruments',
        href: '/dashboard/investments',
        icon: Coins,
      },
      {
        title: 'Holdings and rewards',
        description: 'Check units, funding status, and expected reward.',
        actionLabel: 'View holdings',
        href: '/dashboard/investments',
        icon: Wallet,
      },
    ],
  },
  AUDITOR: {
    title: 'Auditor workspace',
    tagline: 'Review reports, reconciliation, and closure records.',
    summary:
      'The auditor checks the performance report, settlement timeline, and final records.',
    badge: 'Audit view',
    primaryAction: { label: 'Review reports', href: '/dashboard/reports' },
    secondaryAction: { label: 'Inspect audit trail', href: '/dashboard/transactions' },
    sections: [
      {
        title: 'Reports to review',
        description: 'Accept or inspect the performance report before final settlement.',
        actionLabel: 'Open reports',
        href: '/dashboard/reports',
        icon: FileText,
      },
      {
        title: 'Audit trail',
        description: 'Trace the full lifecycle of the managed contract.',
        actionLabel: 'Open trail',
        href: '/dashboard/transactions',
        icon: ScrollText,
      },
    ],
  },
  PAYMENT_VERIFIER: {
    title: 'Payment verifier workspace',
    tagline: 'Confirm funding and reward payments.',
    summary:
      'The payment verifier confirms upfront funding, then confirms reward transfers after reconciliation.',
    badge: 'Payment view',
    primaryAction: { label: 'Confirm funding', href: '/dashboard/transactions' },
    secondaryAction: { label: 'Review settlement', href: '/dashboard/reports' },
    sections: [
      {
        title: 'Funding confirmation',
        description: 'Match subscription payment references with bank confirmation.',
        actionLabel: 'Open audit trail',
        href: '/dashboard/transactions',
        icon: Wallet,
      },
      {
        title: 'Reward payment',
        description: 'Confirm reward transfers once reward records exist.',
        actionLabel: 'Open settlement',
        href: '/dashboard/reports',
        icon: FileText,
      },
    ],
  },
  LEGAL_ADMIN: {
    title: 'Legal workspace',
    tagline: 'Inspect approvals, records, and controlled visibility.',
    summary:
      'Legal admin reviews the contract, investor eligibility, and settlement visibility.',
    badge: 'Legal view',
    primaryAction: { label: 'Inspect contract', href: '/dashboard/properties' },
    secondaryAction: { label: 'Inspect audit trail', href: '/dashboard/transactions' },
    sections: [
      {
        title: 'Contract visibility',
        description: 'Review the managed contract and owner confirmation status.',
        actionLabel: 'Open contract',
        href: '/dashboard/properties',
        icon: Landmark,
      },
      {
        title: 'Audit visibility',
        description: 'Review the record trail for compliance and legal visibility.',
        actionLabel: 'Open trail',
        href: '/dashboard/transactions',
        icon: ScrollText,
      },
    ],
  },
  ADMIN: {
    title: 'Admin workspace',
    tagline: 'System overview, debug, and all-role access.',
    summary:
      'Admin can inspect the whole workflow, role routes, and operational records.',
    badge: 'Admin view',
    primaryAction: { label: 'Open system overview', href: '/dashboard' },
    secondaryAction: { label: 'Open workflow settings', href: '/dashboard/settings' },
    sections: [
      {
        title: 'All workflows',
        description: 'Access the full demo workflow across every role.',
        actionLabel: 'Open dashboard',
        href: '/dashboard',
        icon: ShieldCheck,
      },
      {
        title: 'System settings',
        description: 'Manage demo preferences and notifications.',
        actionLabel: 'Open settings',
        href: '/dashboard/settings',
        icon: Settings,
      },
    ],
  },
};
