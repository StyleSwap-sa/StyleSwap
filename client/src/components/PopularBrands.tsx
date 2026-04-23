import { TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function PopularBrands({ timeRange = "7d" }: { timeRange?: "24h" | "7d" | "30d" }) {
  const { data: brands, isLoading } = 
    trpc.globalFeed.getPopularBrands.useQuery({ timeRange });

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-secondary" />
          Popular Brands
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {brands?.brands.map((brand, index) => (
            <div key={brand.brand} className="flex items-center justify-between p-2 rounded hover:bg-secondary/5">
              <div>
                <p className="font-semibold text-sm">{brand.brand}</p>
                <p className="text-xs text-muted-foreground">{brand.count} outfits</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-primary">{brand.avgLikes.toFixed(1)} avg likes</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}