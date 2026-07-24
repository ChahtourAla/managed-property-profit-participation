import { UserApprovalStatus } from '../enums/user-approval-status.enum';
import { UserRole } from '../enums/user-role.enum';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName?: string | null;
  role: UserRole;
  partyId?: string | null;
  approvalStatus: UserApprovalStatus;
  isActive: boolean;
}
