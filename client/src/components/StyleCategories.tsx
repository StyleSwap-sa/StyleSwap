import { trpc } from "@/lib/trpc";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";


export function StyleCategories({ onCategorySelect }: { onCategorySelect?: (category: string) => void }) {
  const { data: categories, isLoading } = 
    trpc.globalFeed.getStyleCategories.useQuery();

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle>Style Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {categories?.categories.map((cat) => (
            <button
              key={cat.style}
              onClick={() => onCategorySelect?.(cat.style)}
              className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
            >
              {cat.style} ({cat.count})
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}