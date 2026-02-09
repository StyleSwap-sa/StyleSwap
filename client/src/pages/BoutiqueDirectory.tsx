import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Star, Package, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

export default function BoutiqueDirectory() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "rating" | "products" | "name">("newest");
  const limit = 12;

  // Fetch boutiques list
  const { data: boutiquesData, isLoading: isLoadingBoutiques } = trpc.boutiqueDiscovery.getBoutiquesList.useQuery({
    page,
    limit,
    search: search || undefined,
    sortBy,
  });

  // Fetch featured boutiques
  const { data: featuredBoutiques } = trpc.boutiqueDiscovery.getFeaturedBoutiques.useQuery({ limit: 6 });

  // Fetch trending boutiques
  const { data: trendingBoutiques } = trpc.boutiqueDiscovery.getTrendingBoutiques.useQuery({ limit: 6 });

  const handleBoutiqueClick = (slug: string) => {
    navigate(`/boutique/${slug}`);
  };

  const handleShopClick = (slug: string) => {
    navigate(`/boutique/${slug}/shop`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Boutiques</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Browse and shop from StyleSwap's curated collection of boutiques. Find your favorite fashion destinations.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="sticky top-0 z-40 bg-background border-b border-border py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search boutiques..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
                className="px-4 py-2 border border-border rounded-lg bg-background text-sm"
              >
                <option value="newest">Newest</option>
                <option value="rating">Top Rated</option>
                <option value="products">Most Products</option>
                <option value="name">A - Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Featured Boutiques Section */}
        {featuredBoutiques && featuredBoutiques.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Featured Boutiques</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBoutiques.map((boutique) => (
                <Card
                  key={boutique.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleBoutiqueClick(boutique.slug)}
                >
                  <CardHeader>
                    {boutique.logoUrl && (
                      <img
                        src={boutique.logoUrl}
                        alt={boutique.name}
                        className="w-16 h-16 rounded-lg object-cover mb-4"
                      />
                    )}
                    <CardTitle className="text-lg">{boutique.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{boutique.description}</p>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShopClick(boutique.slug);
                      }}
                      className="w-full"
                    >
                      Visit Shop <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Trending Boutiques Section */}
        {trendingBoutiques && trendingBoutiques.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Trending Now</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingBoutiques.map((boutique: any) => (
                <Card
                  key={boutique.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleBoutiqueClick(boutique.slug)}
                >
                  <CardHeader>
                    {boutique.logoUrl && (
                      <img
                        src={boutique.logoUrl}
                        alt={boutique.name}
                        className="w-16 h-16 rounded-lg object-cover mb-4"
                      />
                    )}
                    <CardTitle className="text-lg">{boutique.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{boutique.orderCount || 0} orders</span>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShopClick(boutique.slug);
                      }}
                      className="w-full"
                    >
                      Visit Shop <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* All Boutiques Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">All Boutiques</h2>

          {isLoadingBoutiques ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="w-16 h-16 bg-muted rounded-lg mb-4" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full mb-4" />
                    <div className="h-10 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : boutiquesData?.boutiques.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No boutiques found. Try adjusting your search.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {boutiquesData?.boutiques.map((boutique) => (
                  <Card
                    key={boutique.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleBoutiqueClick(boutique.slug)}
                  >
                    <CardHeader>
                      {boutique.logoUrl && (
                        <img
                          src={boutique.logoUrl}
                          alt={boutique.name}
                          className="w-16 h-16 rounded-lg object-cover mb-4"
                        />
                      )}
                      <CardTitle className="text-lg">{boutique.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{boutique.description}</p>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShopClick(boutique.slug);
                        }}
                        className="w-full"
                      >
                        Visit Shop <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {boutiquesData && boutiquesData.pagination.pages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    {[...Array(boutiquesData.pagination.pages)].map((_, i) => (
                      <Button
                        key={i + 1}
                        variant={page === i + 1 ? "default" : "outline"}
                        onClick={() => setPage(i + 1)}
                        className="w-10"
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.min(boutiquesData.pagination.pages, page + 1))}
                    disabled={page === boutiquesData.pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
