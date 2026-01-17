import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketGrowthChart, FeatureComparisonChart } from "@/components/Charts";

export default function Market() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="py-20 bg-secondary/5 border-y border-secondary/20">
        <div className="container mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold mb-16 text-center">MARKET INTELLIGENCE</h2>
          
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <MarketGrowthChart />
            <div className="grid gap-8">
              <FeatureComparisonChart />
              <Card className="premium-card bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-2xl">KEY OPPORTUNITY</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium leading-relaxed text-muted-foreground">
                    The virtual try-on market is projected to reach <span className="text-primary font-bold">R630 billion by 2032</span>. StyleSwap's low entry cost allows small retailers to capture this growth without enterprise-level investment.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { label: "Market CAGR", value: "36.9%" },
              { label: "Conversion Lift", value: "+40%" },
              { label: "Return Reduction", value: "-30%" },
              { label: "Photo Cost Savings", value: "80%" }
            ].map((stat, i) => (
              <div key={i} className="premium-card p-6 text-center rounded-lg">
                <div className="text-4xl font-heading font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
