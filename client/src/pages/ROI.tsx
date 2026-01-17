import { ROICalculator } from "@/components/ROICalculator";
import Navigation from "@/components/Navigation";

export default function ROI() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <section className="py-20 container mx-auto">
        <h2 className="text-5xl md:text-6xl font-bold mb-16 text-center">ROI CALCULATOR</h2>
        <ROICalculator />
      </section>
    </div>
  );
}
