"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CoinsIcon, CreditCard, Sparkles, TrendingUp, Check } from "lucide-react";
import { CreditsPack, PackId } from "@/types/billing";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { PurchaseCredits } from "@/actions/billing/purchaseCredits";
import { Badge } from "@/components/ui/badge";

function CreditsPurchase() {
  const [selectedPack, setSelectedPack] = React.useState(PackId.MEDIUM);

  const mutation = useMutation({
    mutationFn: PurchaseCredits,
  });

  // Find the selected pack details
  const selectedPackDetails = CreditsPack.find(pack => pack.id === selectedPack);
  
  // Calculate value metrics (if your packs have credit amounts)
  const getPackValue = (pack: typeof CreditsPack[0]) => {
    // Assuming packs have a credits property - adjust based on your type
    const creditsPerDollar = (pack.credits || 0) / (pack.price / 100);
    return creditsPerDollar;
  };

  // Determine most popular/best value
  const mostPopularId = PackId.MEDIUM; // Set your most popular pack
  const bestValueId = CreditsPack.reduce((best, current) => 
    getPackValue(current) > getPackValue(best) ? current : best
  ).id;

  return (
    <Card className="overflow-hidden">
      {/* Header with gradient background */}
      <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-background pb-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <CoinsIcon className="w-5 h-5 text-primary" />
              </div>
              Purchase Credits
            </CardTitle>
            <CardDescription className="text-base">
              Select a credit package to power your workflows
            </CardDescription>
          </div>
          
          {/* Live balance indicator (optional - if you have current balance) */}
          {/* <div className="text-right">
            <p className="text-xs text-muted-foreground">Current Balance</p>
            <p className="text-lg font-bold text-primary">1,250 credits</p>
          </div> */}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <RadioGroup
          onValueChange={(value) => setSelectedPack(value as PackId)}
          value={selectedPack}
          className="space-y-3"
        >
          {CreditsPack.map((pack) => {
            const isSelected = selectedPack === pack.id;
            const isBestValue = pack.id === bestValueId;
            const isMostPopular = pack.id === mostPopularId;
            
            return (
              <div
                key={pack.id}
                className={`relative flex items-center rounded-xl border-2 p-4 transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                    : "border-border bg-background hover:border-primary/50 hover:bg-muted/50"
                }`}
                onClick={() => setSelectedPack(pack.id)}
              >
                {/* Badges */}
                {(isBestValue || isMostPopular) && (
                  <div className="absolute -top-2 left-4 flex gap-2">
                    {isBestValue && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 border-0 shadow-sm">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Best Value
                      </Badge>
                    )}
                    {isMostPopular && !isBestValue && (
                      <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 border-0 shadow-sm">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    )}
                  </div>
                )}

                {/* Radio button */}
                <RadioGroupItem 
                  value={pack.id} 
                  id={pack.id} 
                  className={`${isSelected ? 'border-primary' : ''}`}
                />

                {/* Content */}
                <Label
                  htmlFor={pack.id}
                  className="flex items-center justify-between flex-1 ml-3 cursor-pointer"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{pack.name}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{pack.label}</span>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      ${(pack.price / 100).toFixed(2)}
                    </div>
                    {/* Optional: Show credits per dollar */}
                    {/* <div className="text-xs text-muted-foreground">
                      {getPackValue(pack).toFixed(1)} credits/$
                    </div> */}
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        {/* Selected pack summary */}
        {selectedPackDetails && (
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Selected Package</p>
                <p className="text-lg font-semibold">{selectedPackDetails.name}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-primary">
                  ${(selectedPackDetails.price / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 bg-muted/20 pt-6">
        <Button
          className="w-full h-12 text-base font-semibold gap-2 shadow-sm hover:shadow-md transition-all"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(selectedPack)}
        >
          {mutation.isPending ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Purchase {selectedPackDetails?.name || 'Credits'}
            </>
          )}
        </Button>
        
        {/* Security note */}
        <p className="text-xs text-center text-muted-foreground">
          Secure payment powered by Stripe • Credits are added instantly
        </p>
      </CardFooter>
    </Card>
  );
}

export default CreditsPurchase;
