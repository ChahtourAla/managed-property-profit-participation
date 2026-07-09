export const TEMPLATE_IDS = {
  OwnerSubmittedManagedContractDraft:
    '#smart-contracts-main:ManagedContract:OwnerSubmittedManagedContractDraft',

  ValidatedManagedContract:
    '#smart-contracts-main:ManagedContract:ValidatedManagedContract',

  RejectedManagedContract:
    '#smart-contracts-main:ManagedContract:RejectedManagedContract',

  TokenizedInstrument:
    '#smart-contracts-main:ManagedContract:TokenizedInstrument',

  ApprovedInvestor: '#smart-contracts-main:Subscription:ApprovedInvestor',

  TokenSupply: '#smart-contracts-main:Subscription:TokenSupply',

  InvestorSubscription:
    '#smart-contracts-main:Subscription:InvestorSubscription',

  FundingConfirmation: '#smart-contracts-main:Subscription:FundingConfirmation',

  ProfitParticipationHolding:
    '#smart-contracts-main:Subscription:ProfitParticipationHolding',

  PerformanceReport: '#smart-contracts-main:Reporting:PerformanceReport',

  ReportAccepted: '#smart-contracts-main:Reporting:ReportAccepted',

  FinalReconciliation: '#smart-contracts-main:Settlement:FinalReconciliation',

  RewardRecord: '#smart-contracts-main:Settlement:RewardRecord',

  RewardPaymentConfirmation:
    '#smart-contracts-main:Settlement:RewardPaymentConfirmation',

  ClosedManagedContract:
    '#smart-contracts-main:Settlement:ClosedManagedContract',

  TokenRedemptionBurnRecord:
    '#smart-contracts-main:Settlement:TokenRedemptionBurnRecord',
} as const;
