import {
  LayoutDashboard,
  FileText,
  Coins,
  Landmark,
  ScrollText,
  Activity,
  User,
  Settings,
  type LucideIcon,
} from 'lucide-react';

import type { AppRole } from '@/lib/role-config';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  roles: AppRole[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const mainNav: NavGroup[] = [
  {
    label: 'Workspaces',
    items: [
      {
        title: 'Project Overview',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Role-based summary of the managed property POC',
        roles: ['OWNER', 'EASYCOIN', 'INVESTOR', 'AUDITOR', 'PAYMENT_VERIFIER', 'LEGAL_ADMIN', 'ADMIN'],
      },
      {
        title: 'Managed Contract',
        href: '/dashboard/properties',
        icon: Landmark,
        description: 'Contract draft, validation, and token readiness',
        roles: ['OWNER', 'EASYCOIN', 'LEGAL_ADMIN', 'ADMIN'],
      },
      {
        title: 'Investor Participation',
        href: '/dashboard/investments',
        icon: Coins,
        description: 'Investors, funding, holdings, and expected rewards',
        roles: ['OWNER', 'EASYCOIN', 'INVESTOR', 'ADMIN'],
      },
      {
        title: 'Holdings',
        href: '/dashboard/holdings',
        icon: Coins,
        description: 'Active holdings before rewards and redemption',
        roles: ['OWNER', 'INVESTOR', 'EASYCOIN', 'AUDITOR', 'LEGAL_ADMIN', 'PAYMENT_VERIFIER'],
      },
      {
        title: 'Funding Confirmation',
        href: '/dashboard/investments',
        icon: Coins,
        description: 'Confirm investor upfront payment receipts',
        roles: ['PAYMENT_VERIFIER'],
      },
      {
        title: 'Performance & Settlement',
        href: '/dashboard/reports',
        icon: FileText,
        description: 'Reports, reconciliation, rewards, and closure',
        roles: ['OWNER', 'EASYCOIN', 'AUDITOR', 'PAYMENT_VERIFIER', 'LEGAL_ADMIN', 'ADMIN'],
      },
      {
        title: 'Audit Trail',
        href: '/dashboard/transactions',
        icon: ScrollText,
        description: 'Funding confirmations and lifecycle events',
        roles: ['EASYCOIN', 'AUDITOR', 'PAYMENT_VERIFIER', 'LEGAL_ADMIN', 'ADMIN'],
      },
      {
        title: 'Demo Summary',
        href: '/dashboard/demo-summary',
        icon: FileText,
        description: 'Final workflow state across validation, settlement, and redemption',
        roles: ['OWNER', 'EASYCOIN', 'INVESTOR', 'AUDITOR', 'PAYMENT_VERIFIER', 'LEGAL_ADMIN', 'ADMIN'],
      },
      {
        title: 'Workflow Status',
        href: '/dashboard/settings',
        icon: Activity,
        description: 'System checks and demo preferences',
        roles: ['ADMIN', 'EASYCOIN'],
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        title: 'Profile',
        href: '/dashboard/profile',
        icon: User,
        description: 'Current demo identity',
        roles: ['OWNER', 'EASYCOIN', 'INVESTOR', 'AUDITOR', 'PAYMENT_VERIFIER', 'LEGAL_ADMIN', 'ADMIN'],
      },
      {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        description: 'Notifications and preferences',
        roles: ['OWNER', 'EASYCOIN', 'INVESTOR', 'AUDITOR', 'PAYMENT_VERIFIER', 'LEGAL_ADMIN', 'ADMIN'],
      },
    ],
  },
];

export const flatNav: NavItem[] = mainNav.flatMap((group) => group.items);

export function getNavForRole(role: AppRole) {
  return mainNav
    .map((group) => ({
      label: group.label,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}

export function getAllowedNavItem(role: AppRole, href: string) {
  return flatNav.find((item) => item.href === href && item.roles.includes(role));
}
