import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Check } from "lucide-react";
import { useLocation } from "wouter";

interface UpgradePromptProps {
  showAfterFreeTrial?: boolean;
}

export function UpgradePrompt({ showAfterFreeTrial = true }: UpgradePromptProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const [, setLocation] = useLocation();

  // Check free trial status
  const { data: freeTrialStatus } = trpc.freeTrial.getStatus.useQuery();

  // Show upgrade prompt if free trial was just used
  useEffect(() => {
    if (showAfterFreeTrial && freeTrialStatus?.isUsed && !freeTrialStatus?.hasFreeTrial) {
      setShouldShow(true);
    }
  }, [freeTrialStatus, showAfterFreeTrial]);

  if (!shouldShow) {
    return null;
  }

  const pricingTiers = [
    {
      name: "Starter",
      price: "R45",
      tryOns: 10,
      pricePerTryOn: "R4.50",
      features: ["10 try-ons", "Instant results", "Save favorites", "Share results"],
    },
    {
      name: "Pro",
      price: "R150",
      tryOns: 50,
      pricePerTryOn: "R3.00",
      features: ["50 try-ons", "Instant results", "Save favorites", "Share results", "Priority support"],
      highlighted: true,
    },
  ];

  return (
    <div className="mt-8 space-y-4">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-lg">Love your try-on?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Get more try-ons and keep exploring styles with our affordable packages
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              className={tier.highlighted ? "border-primary border-2 relative" : ""}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className={tier.highlighted ? "pt-8" : ""}>
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <CardDescription>{tier.tryOns} try-ons</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">{tier.price}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tier.pricePerTryOn} per try-on
                  </p>
                </div>

                <ul className="space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => setLocation("/pricing-page")}
                  className="w-full"
                  variant={tier.highlighted ? "default" : "outline"}
                >
                  Get {tier.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Your free try-on expires in {freeTrialStatus?.daysRemaining || 0} days
      </p>
    </div>
  );
}
