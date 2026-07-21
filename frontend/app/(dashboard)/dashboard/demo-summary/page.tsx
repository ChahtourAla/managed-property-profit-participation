'use client';

import * as React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

import { useSession } from '@/lib/session';
import {
  getHoldings,
  getInstruments,
  getValidatedContracts,
  getSettlements,
  getRewardRecords,
  getRewardPaymentConfirmations,
  getRedemptionRecords,
  getDamlCreateArguments,
  toNumber,
  toStringValue,
} from '@/lib/platform-api';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ValidatedContractSummary = {
  contractId: string;
  propertyName: string;
  status: string;
};

type InstrumentSummary = {
  contractId: string;
  instrumentId: string;
  totalUnits: number;
};

type HoldingSummary = {
  contractId: string;
  instrumentId: string;
  holder: string;
  amount: number;
  status: string;
};

type SettlementSummary = {
  contractId: string;
  instrumentId: string;
  investorRewardPool: number;
  ownerRetainedProfit: number;
  status: string;
};

type RewardSummary = {
  contractId: string;
  instrumentId: string;
  recipient: string;
  holdingCid: string;
  amount: number;
};

type RewardConfirmationSummary = {
  contractId: string;
  instrumentId: string;
  rewardAmount: number;
  confirmedPaymentReference: string;
  status: string;
};

type RedemptionSummary = {
  contractId: string;
  instrumentId: string;
  redeemedUnits: number;
  burnReference: string;
  status: string;
};

export default function DemoSummaryPage() {
  const { session } = useSession();
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [contracts, setContracts] = React.useState<ValidatedContractSummary[]>([]);
  const [instruments, setInstruments] = React.useState<InstrumentSummary[]>([]);
  const [holdings, setHoldings] = React.useState<HoldingSummary[]>([]);
  const [settlements, setSettlements] = React.useState<SettlementSummary[]>([]);
  const [rewardRecords, setRewardRecords] = React.useState<RewardSummary[]>([]);
  const [rewardConfirmations, setRewardConfirmations] = React.useState<RewardConfirmationSummary[]>([]);
  const [redemptions, setRedemptions] = React.useState<RedemptionSummary[]>([]);

  const loadData = React.useCallback(async () => {
    setLoading(true);

    try {
      const [contractsResponse, instrumentsResponse, holdingsResponse, settlementsResponse, rewardRecordsResponse, rewardConfirmationsResponse, redemptionsResponse] =
        await Promise.all([
          getValidatedContracts(session.accessToken),
          getInstruments(session.accessToken),
          getHoldings(session.accessToken),
          getSettlements(session.accessToken),
          getRewardRecords(session.accessToken),
          getRewardPaymentConfirmations(session.accessToken),
          getRedemptionRecords(session.accessToken),
        ]);

      setContracts(
        contractsResponse
          .map((event) => {
            const args = getDamlCreateArguments<{
              propertyName?: unknown;
              status?: unknown;
            }>({ contractId: String(event.contractId), createArguments: event.createArguments });

            return {
              contractId: String(event.contractId),
              propertyName: toStringValue(args.propertyName, ''),
              status: toStringValue(args.status, 'VALIDATED'),
            };
          })
          .filter((item) => item.contractId)
      );

      setInstruments(
        instrumentsResponse
          .map((event) => {
            const args = getDamlCreateArguments<{
              instrumentId?: unknown;
              totalUnits?: unknown;
            }>({ contractId: String(event.contractId), createArguments: event.createArguments });

            return {
              contractId: String(event.contractId),
              instrumentId: toStringValue(args.instrumentId, ''),
              totalUnits: toNumber(args.totalUnits),
            };
          })
          .filter((item) => item.instrumentId)
      );

      setHoldings(
        holdingsResponse
          .map((event) => {
            const args = getDamlCreateArguments<{
              instrumentId?: unknown;
              holder?: unknown;
              amount?: unknown;
              units?: unknown;
              status?: unknown;
            }>({ contractId: String(event.contractId), createArguments: event.createArguments });

            return {
              contractId: String(event.contractId),
              instrumentId: toStringValue(args.instrumentId, ''),
              holder: toStringValue(args.holder, ''),
              amount: toNumber(args.amount ?? args.units),
              status: toStringValue(args.status, 'ACTIVE'),
            };
          })
          .filter((item) => item.instrumentId)
      );

      setSettlements(
        settlementsResponse
          .map((event) => {
            const args = getDamlCreateArguments<{
              instrumentId?: unknown;
              investorRewardPool?: unknown;
              ownerRetainedProfit?: unknown;
              status?: unknown;
            }>({ contractId: String(event.contractId), createArguments: event.createArguments });

            return {
              contractId: String(event.contractId),
              instrumentId: toStringValue(args.instrumentId, ''),
              investorRewardPool: toNumber(args.investorRewardPool),
              ownerRetainedProfit: toNumber(args.ownerRetainedProfit),
              status: toStringValue(args.status, 'RECONCILED'),
            };
          })
          .filter((item) => item.instrumentId)
      );

      setRewardRecords(
        rewardRecordsResponse
          .map((event) => {
            const args = getDamlCreateArguments<{
              instrumentId?: unknown;
              recipient?: unknown;
              holdingCid?: unknown;
              rewardAmount?: unknown;
            }>({ contractId: String(event.contractId), createArguments: event.createArguments });

            return {
              contractId: String(event.contractId),
              instrumentId: toStringValue(args.instrumentId, ''),
              recipient: toStringValue(args.recipient, ''),
              holdingCid: toStringValue(args.holdingCid, ''),
              amount: toNumber(args.rewardAmount),
            };
          })
          .filter((item) => item.instrumentId)
      );

      setRewardConfirmations(
        rewardConfirmationsResponse
          .map((event) => {
            const args = getDamlCreateArguments<{
              instrumentId?: unknown;
              rewardAmount?: unknown;
              confirmedPaymentReference?: unknown;
              status?: unknown;
            }>({ contractId: String(event.contractId), createArguments: event.createArguments });

            return {
              contractId: String(event.contractId),
              instrumentId: toStringValue(args.instrumentId, ''),
              rewardAmount: toNumber(args.rewardAmount),
              confirmedPaymentReference: toStringValue(args.confirmedPaymentReference, ''),
              status: toStringValue(args.status, 'REWARD_PAID'),
            };
          })
          .filter((item) => item.instrumentId)
      );

      setRedemptions(
        redemptionsResponse
          .map((event) => {
            const args = getDamlCreateArguments<{
              instrumentId?: unknown;
              redeemedUnits?: unknown;
              burnReference?: unknown;
              status?: unknown;
            }>({ contractId: String(event.contractId), createArguments: event.createArguments });

            return {
              contractId: String(event.contractId),
              instrumentId: toStringValue(args.instrumentId, ''),
              redeemedUnits: toNumber(args.redeemedUnits),
              burnReference: toStringValue(args.burnReference, ''),
              status: toStringValue(args.status, 'TOKENS_REDEEMED_BURNED'),
            };
          })
          .filter((item) => item.instrumentId)
      );
    } finally {
      setLoading(false);
    }
  }, [session.accessToken]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  const totalHoldingUnits = holdings.reduce((sum, item) => sum + item.amount, 0);
  const totalRewardAmount = rewardRecords.reduce((sum, item) => sum + item.amount, 0);
  const totalConfirmedRewardAmount = rewardConfirmations.reduce((sum, item) => sum + item.rewardAmount, 0);
  const totalRedeemedUnits = redemptions.reduce((sum, item) => sum + item.redeemedUnits, 0);
  const allHoldingsRedeemed = holdings.length === 0 && redemptions.length > 0;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Demo summary"
        description="Final workflow state across contract validation, token setup, holdings, settlement, payment confirmation, and redemption burn."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Validated contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{contracts.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Token instruments</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{instruments.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{holdings.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total units</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{totalHoldingUnits}</span>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Settlements</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{settlements.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reward records</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{rewardRecords.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed payments</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{rewardConfirmations.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Redemptions</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{redemptions.length}</span>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Final workflow status</CardTitle>
            <CardDescription>Audit the completed demo flow in one place.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Contract validation</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={contracts.length > 0 ? 'secondary' : 'outline'}>{contracts.length > 0 ? 'Validated' : 'Missing'}</Badge>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Instrument setup</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={instruments.length > 0 ? 'secondary' : 'outline'}>{instruments.length > 0 ? 'Ready' : 'Pending'}</Badge>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Settlement complete</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={settlements.length > 0 ? 'secondary' : 'outline'}>{settlements.length > 0 ? 'Complete' : 'Waiting'}</Badge>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Redemption burn</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={redemptions.length > 0 ? 'secondary' : 'outline'}>{redemptions.length > 0 ? 'Processed' : 'Not processed'}</Badge>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4 sm:col-span-2">
              <p className="text-sm text-muted-foreground">Expected reward paid</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={rewardConfirmations.length > 0 ? 'secondary' : 'outline'}>{rewardConfirmations.length > 0 ? 'Confirmed' : 'Pending'}</Badge>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4 sm:col-span-2">
              <p className="text-sm text-muted-foreground">Holdings lifecycle</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={allHoldingsRedeemed ? 'secondary' : 'outline'}>{allHoldingsRedeemed ? 'Redeemed' : 'Active'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Summary totals</CardTitle>
            <CardDescription>Amounts and unit totals across the workflow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <p className="text-sm text-muted-foreground">Total reward amount</p>
                <p className="mt-2 text-lg font-semibold">{formatCurrency(totalRewardAmount)}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <p className="text-sm text-muted-foreground">Confirmed reward payouts</p>
                <p className="mt-2 text-lg font-semibold">{formatCurrency(totalConfirmedRewardAmount)}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <p className="text-sm text-muted-foreground">Redeemed units</p>
                <p className="mt-2 text-lg font-semibold">{totalRedeemedUnits}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <p className="text-sm text-muted-foreground">Remaining holdings</p>
                <p className="mt-2 text-lg font-semibold">{totalHoldingUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
