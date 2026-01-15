import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Heart } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface FavoriteGarment {
  garmentId: number;
  addedAt: Date;
}

export function GarmentCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // Fetch garments
  const { data: garments = [], isLoading } = trpc.garments.getAll.useQuery();

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(garments.map(g => g.category));
    return Array.from(cats).sort();
  }, [garments]);

  // Filter garments
  const filteredGarments = useMemo(() => {
    return garments.filter(garment => {
      const matchesSearch = garment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           garment.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || garment.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [garments, searchQuery, selectedCategory]);

  const toggleFavorite = (garmentId: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(garmentId)) {
      newFavorites.delete(garmentId);
    } else {
      newFavorites.add(garmentId);
    }
    setFavorites(newFavorites);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Garment Catalog</h2>
          <p className="text-muted-foreground">
            Browse our collection of premium garments and try them on virtually
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search garments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border/40 bg-background focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="px-4 py-2 rounded-lg border border-border/40 bg-background focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredGarments.length} of {garments.length} garments
      </div>

      {/* Garments Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="premium-card animate-pulse">
              <div className="w-full h-64 bg-muted rounded-t-lg" />
              <CardContent className="pt-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredGarments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGarments.map(garment => (
            <Card key={garment.id} className="premium-card hover:shadow-lg transition-all duration-300 overflow-hidden group">
              {/* Image Container */}
              <div className="relative overflow-hidden bg-muted h-64">
                <img
                  src={garment.imageUrl}
                  alt={garment.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Favorite Button */}
                <button
                  onClick={() => toggleFavorite(garment.id)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      favorites.has(garment.id)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              </div>

              {/* Content */}
              <CardContent className="pt-4 space-y-3">
                {/* Category Badge */}
                <div className="inline-block bg-secondary/20 text-secondary px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider">
                  {garment.category}
                </div>

                {/* Name */}
                <h3 className="font-bold text-lg line-clamp-2">{garment.name}</h3>

                {/* Description */}
                {garment.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {garment.description}
                  </p>
                )}

                {/* Price */}
                <div className="flex items-center justify-between pt-2 border-t border-border/20">
                  <span className="text-primary font-bold text-lg">{garment.price}</span>
                  <span className="text-xs text-muted-foreground">{garment.currency}</span>
                </div>

                {/* Try On Button */}
                <Button
                  className="w-full premium-button bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    // This would navigate to the try-on component with this garment pre-selected
                    window.location.href = `/dashboard?garment=${garment.id}`;
                  }}
                >
                  Try This On
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="premium-card">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No garments found matching your search</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Favorites Section */}
      {favorites.size > 0 && (
        <Card className="premium-card border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 fill-primary text-primary" />
              Your Favorites ({favorites.size})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You have {favorites.size} favorite garment{favorites.size !== 1 ? 's' : ''} saved. 
              You can quickly try these on from your dashboard.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
