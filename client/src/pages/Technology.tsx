import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Zap, BarChart3 } from "lucide-react";

export default function Technology() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="py-20 container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6">CORE TECHNOLOGY</h2>
            <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">
              StyleSwap leverages cutting-edge Generative Adversarial Networks (GANs) to create hyper-realistic clothing simulations that go far beyond simple 2D overlays.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-4 h-4 bg-primary rounded-full"></div>
            <div className="w-4 h-4 bg-secondary rounded-full"></div>
            <div className="w-4 h-4 bg-foreground/20 rounded-full"></div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            {
              title: "Generative AI",
              icon: <Sparkles className="w-8 h-8" />,
              desc: "Uses StyleGAN and CycleGAN to generate synthetic images that capture fabric texture, shadows, and folds with photorealistic accuracy."
            },
            {
              title: "Pose Estimation",
              icon: <Zap className="w-8 h-8" />,
              desc: "Algorithms like OpenPose detect key body points to map the user's unique physique and posture in 3D space."
            },
            {
              title: "Neural Rendering",
              icon: <BarChart3 className="w-8 h-8" />,
              desc: "Simulates physical fabric properties including draping, stretch, and light reflection for natural-looking fit."
            }
          ].map((card, i) => (
            <Card key={i} className="premium-card hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center mb-4 text-primary">
                  {card.icon}
                </div>
                <CardTitle className="text-2xl">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {card.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <img 
              src="/images/tech-visualization.jpg" 
              alt="Tech Visualization" 
              className="w-full rounded-2xl shadow-2xl border border-border/20"
            />
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <h3 className="text-4xl font-bold">THE WORKFLOW</h3>
            <ul className="space-y-4">
              {[
                "User uploads a full-body photo",
                "AI analyzes body shape and posture",
                "Garment is segmented and mapped to body mesh",
                "Neural rendering applies fabric physics",
                "Final HD image generated in < 15 seconds"
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-4 p-4 premium-card rounded-lg">
                  <span className="font-heading font-bold text-xl text-primary">0{i+1}</span>
                  <span className="font-medium text-muted-foreground">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
