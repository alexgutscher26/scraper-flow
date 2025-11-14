import React, { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GetAvailableCredits } from "@/actions/billing/getAvailableCredits";
import ReactCountUpWrapper from "@/components/ReactCountUpWrapper";
import { 
  ArrowLeftRight, 
  Coins, 
  CreditCard, 
  AlertTriangle,
  TrendingUp,
  Receipt,
  Sparkles
} from "lucide-react";
import CreditsPurchase from "./_components/CreditsPurchase";
import { Period } from "@/types/analytics";
import { GetCreditUsageInPeriod } from "@/actions/analytics/getCreditUsageInPeriod";
import CreditUsageChat from "./_components/CreditUsageChat";
import { GetUserPurchaseHistory } from "@/actions/billing/getUserPurchaseHistory";
import InvoiceBtn from "./_components/InvoiceBtn";
import { formatDate, formatAmount } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

function BillingPage() {
  return (
    <div className="flex flex-1 flex-col h-full">
      {/* Enhanced Header */}
      <div className="flex flex-col gap-2 pb-6 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing & Credits</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your credits, view usage, and purchase history
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-6 space-y-6">
        {/* Balance Card */}
        <Suspense fallback={<BalanceCardSkeleton />}>
          <BalanceCard />
        </Suspense>

        {/* Two Column Layout for Purchase and Usage */}
        <div className="grid gap-6 lg:grid-cols-2">
          <CreditsPurchase />
          
          <Suspense fallback={<ChartSkeleton />}>
            <CreditUsageCard />
          </Suspense>
        </div>

        {/* Transaction History */}
        <Suspense fallback={<TransactionHistorySkeleton />}>
          <TransactionHistoryCard />
        </Suspense>
      </div>
    </div>
  );
}

export default BillingPage;

async function BalanceCard() {
  const userBalance = await GetAvailableCredits();
  const isLowBalance = userBalance < 100; // Threshold for low balance warning
  const isCritical = userBalance < 10;

  return (
    <Card className="relative overflow-hidden border-2 transition-all hover:shadow-lg">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
      
      {/* Decorative background icon */}
      <Coins
        size={200}
        className="absolute -bottom-8 -right-8 text-primary opacity-5"
        strokeWidth={1}
      />

      <CardContent className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Available Credits
              </h3>
              {isLowBalance && (
                <Badge 
                  variant={isCritical ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {isCritical ? "Critical" : "Low"}
                </Badge>
              )}
            </div>
            
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-bold text-primary">
                <ReactCountUpWrapper value={Math.max(0, userBalance)} />
              </p>
              <Sparkles className="w-6 h-6 text-primary/60" />
            </div>

            {isLowBalance && (
              <Alert className={`mt-4 ${isCritical ? 'border-destructive bg-destructive/10' : 'border-amber-500 bg-amber-500/10'}`}>
                <AlertTriangle className={`h-4 w-4 ${isCritical ? 'text-destructive' : 'text-amber-600'}`} />
                <AlertDescription className={isCritical ? 'text-destructive' : 'text-amber-900 dark:text-amber-100'}>
                  {isCritical 
                    ? 'Your credit balance is critically low. Workflows will stop working when credits reach zero.'
                    : 'Your credit balance is running low. Consider purchasing more credits to avoid interruptions.'
                  }
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Status indicator */}
          <div className="flex flex-col items-end gap-2">
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
              isCritical 
                ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20' 
                : isLowBalance 
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                : 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isCritical ? 'bg-red-500 animate-pulse' : isLowBalance ? 'bg-amber-500' : 'bg-green-500'
              }`} />
              {isCritical ? 'Critical' : isLowBalance ? 'Low Balance' : 'Healthy'}
            </div>
          </div>
        </div>
      </CardContent>

      {!isLowBalance && (
        <CardFooter className="relative border-t bg-muted/20 text-muted-foreground text-sm py-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>Your workflows are running smoothly with sufficient credits</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

async function CreditUsageCard() {
  const period: Period = {
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  };
  const data = await GetCreditUsageInPeriod(period);
  return (
    <CreditUsageChat
      data={data}
      title="Credits Consumed"
      description="Daily credit consumption in the current month"
    />
  );
}

async function TransactionHistoryCard() {
  const purchases = await GetUserPurchaseHistory();
  
  return (
    <Card>
      <CardHeader className="bg-gradient-to-br from-background to-muted/20">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
          </div>
          Transaction History
        </CardTitle>
        <CardDescription>
          View your transaction history and download invoices for your records
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        {purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-muted-foreground mb-1">
              No transactions yet
            </p>
            <p className="text-sm text-muted-foreground/70">
              Your purchase history will appear here once you buy credits
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {purchases.map((purchase, index) => (
              <div
                key={purchase.id}
                className="flex items-center justify-between py-4 px-4 rounded-lg transition-colors hover:bg-muted/50 border border-transparent hover:border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Receipt className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {formatDate(purchase.date)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {purchase.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {formatAmount(purchase.amount, purchase.currency)}
                    </p>
                    <InvoiceBtn id={purchase.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {purchases.length > 0 && (
        <CardFooter className="border-t bg-muted/20 text-xs text-muted-foreground justify-center py-3">
          <span>All transactions are securely processed through Stripe</span>
        </CardFooter>
      )}
    </Card>
  );
}

// Skeleton Components
function BalanceCardSkeleton() {
  return (
    <Card className="h-[180px]">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card className="h-[500px]">
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-[380px] w-full" />
      </div>
    </Card>
  );
}

function TransactionHistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between py-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}