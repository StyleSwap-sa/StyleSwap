import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, ShoppingCart, BarChart3 } from "lucide-react";

export function CaseStudies() {
  const caseStudies = [
    {
      company: "Urban Threads Boutique",
      location: "Johannesburg, South Africa",
      type: "Fashion Boutique",
      challenge: "High return rates (35%) and low online conversion due to fit uncertainty",
      solution: "Implemented StyleSwap virtual try-on on their Shopify store",
      results: [
        { metric: "Return Rate", value: "-28%", icon: TrendingUp },
        { metric: "Conversion Rate", value: "+42%", icon: ShoppingCart },
        { metric: "Customer Confidence", value: "+65%", icon: Users },
        { metric: "Photo Production Cost", value: "-75%", icon: BarChart3 }
      ],
      testimonial: "StyleSwap transformed our online business. Customers now feel confident buying online, and our return logistics costs dropped significantly.",
      author: "Thembi Mthembu, Owner"
    },
    {
      company: "Luxe Fashion Co.",
      location: "Cape Town, South Africa",
      type: "Luxury Fashion Brand",
      challenge: "Needed premium product photography without expensive photoshoots",
      solution: "Used StyleSwap AI Clothes Changer for diverse model imagery",
      results: [
        { metric: "Time to Market", value: "-60%", icon: TrendingUp },
        { metric: "Photography Budget", value: "-80%", icon: BarChart3 },
        { metric: "Model Diversity", value: "+200%", icon: Users },
        { metric: "Product SKUs", value: "+150%", icon: ShoppingCart }
      ],
      testimonial: "We can now showcase our collections on diverse models without the expense of traditional photoshoots. It's a game-changer for luxury retail.",
      author: "Naledi Khumalo, Marketing Director"
    },
    {
      company: "FastStyle Online",
      location: "Durban, South Africa",
      type: "Fast Fashion E-commerce",
      challenge: "Rapid inventory turnover required constant new product photography",
      solution: "Integrated StyleSwap for instant catalog generation and consumer try-ons",
      results: [
        { metric: "Inventory Velocity", value: "+85%", icon: TrendingUp },
        { metric: "Production Cost", value: "-70%", icon: BarChart3 },
        { metric: "Customer Satisfaction", value: "+58%", icon: Users },
        { metric: "SKU Launch Speed", value: "3x Faster", icon: ShoppingCart }
      ],
      testimonial: "StyleSwap enabled us to launch 3x more products per month. Our customers love the try-on feature, and our return rates have plummeted.",
      author: "Sipho Ndlela, Operations Manager"
    }
  ];

  return (
    <section className="py-20 container mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-5xl md:text-6xl font-bold mb-6">PROVEN RESULTS</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          See how StyleSwap is transforming fashion retail across South Africa, from boutiques to enterprise brands.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {caseStudies.map((study, index) => (
          <Card key={index} className="premium-card rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/20">
              <div className="mb-4">
                <div className="inline-block px-3 py-1 bg-primary/20 rounded-full text-xs font-bold text-primary mb-3">
                  {study.type}
                </div>
                <CardTitle className="text-2xl">{study.company}</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">{study.location}</p>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pt-6">
              <div className="mb-6 flex-1">
                <h4 className="font-bold text-sm uppercase tracking-wide text-muted-foreground mb-2">Challenge</h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {study.challenge}
                </p>

                <h4 className="font-bold text-sm uppercase tracking-wide text-muted-foreground mb-2">Solution</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {study.solution}
                </p>
              </div>

              <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-bold text-sm uppercase tracking-wide mb-4">Results</h4>
                <div className="grid grid-cols-2 gap-3">
                  {study.results.map((result, i) => {
                    const Icon = result.icon;
                    return (
                      <div key={i} className="text-center">
                        <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                        <div className="text-lg font-bold text-primary">{result.value}</div>
                        <div className="text-xs text-muted-foreground">{result.metric}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border/20 pt-4">
                <p className="text-sm italic text-muted-foreground mb-3">
                  "{study.testimonial}"
                </p>
                <p className="text-xs font-bold text-primary">— {study.author}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Impact Summary */}
      <div className="mt-16 premium-card bg-gradient-to-r from-primary/5 to-secondary/5 p-12 rounded-2xl border-primary/30">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Active Retailers", value: "150+" },
            { label: "Monthly Try-Ons", value: "2.5M+" },
            { label: "Avg. ROI", value: "340%" },
            { label: "Return Rate Reduction", value: "32%" }
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
