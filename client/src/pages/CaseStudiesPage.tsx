import { CaseStudies } from "@/components/CaseStudies";

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="py-20 container mx-auto">
        <h2 className="text-5xl md:text-6xl font-bold mb-16 text-center">PROVEN RESULTS</h2>
        <p className="text-center text-muted-foreground text-lg mb-16 max-w-2xl mx-auto">
          See how StyleSwap is transforming fashion retail across South Africa, from boutiques to enterprise brands.
        </p>
        <CaseStudies />
      </section>
    </div>
  );
}
