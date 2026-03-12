import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Star, Heart, ExternalLink, Zap, TrendingUp, Award, Users } from "lucide-react";
import { toast } from "sonner";

export default function BoutiqueMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>();
  const [selectedCity, setSelectedCity] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "rating" | "trending">("popular");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // Fetch data
  const categoriesQuery = trpc.boutiqueMarketplace.getCategories.useQuery();
  const countriesQuery = trpc.boutiqueMarketplace.getCountries.useQuery();
  const citiesQuery = trpc.boutiqueMarketplace.getCities.useQuery(
    { country: selectedCountry || "" },
    { enabled: !!selectedCountry }
  );
  const boutiquesQuery = trpc.boutiqueMarketplace.listBoutiques.useQuery({
    search: searchQuery,
    category: selectedCategory,
    country: selectedCountry,
    city: selectedCity,
    sortBy,
  });
  const featuredQuery = trpc.boutiqueMarketplace.getFeaturedBoutiques.useQuery();
  const trendingQuery = trpc.boutiqueMarketplace.getTrendingBoutiques.useQuery();
  const topRatedQuery = trpc.boutiqueMarketplace.getTopRatedBoutiques.useQuery();
  const statsQuery = trpc.boutiqueMarketplace.getBoutiqueStats.useQuery();

  // Record event mutation
  const recordEventMutation = trpc.boutiqueMarketplace.recordEvent.useMutation();

  const handleFavorite = (boutiqueId: number) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(boutiqueId)) {
        newSet.delete(boutiqueId);
        toast.success("Removed from favorites");
      } else {
        newSet.add(boutiqueId);
        toast.success("Added to favorites");
      }
      return newSet;
    });
  };

  const handleVisitBoutique = (boutiqueId: number) => {
    recordEventMutation.mutate({ boutiqueId, eventType: "click" });
  };

  const BoutiqueCard = ({ boutique, featured = false }: { boutique: any; featured?: boolean }) => (
    <Card className={`hover:shadow-lg transition-shadow ${featured ? "border-yellow-400" : ""}`}>
      {boutique.bannerUrl && (
        <div className="w-full h-32 bg-gray-200 overflow-hidden rounded-t-lg">
          <img src={boutique.bannerUrl} alt={boutique.name} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {boutique.logoUrl && (
                <img src={boutique.logoUrl} alt={boutique.name} className="w-10 h-10 rounded-full" />
              )}
              <div>
                <CardTitle className="text-lg">{boutique.name}</CardTitle>
                {boutique.isVerified && (
                  <p className="text-xs text-blue-600 font-semibold">✓ Verified</p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {boutique.city}, {boutique.country}
            </p>
          </div>
          <button
            onClick={() => handleFavorite(boutique.id)}
            className={`p-2 rounded-full transition ${
              favorites.has(boutique.id) ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"
            }`}
          >
            <Heart className="w-5 h-5" fill={favorites.has(boutique.id) ? "currentColor" : "none"} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {boutique.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{boutique.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Items</p>
            <p className="font-semibold">{boutique.itemCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Rating</p>
            <p className="font-semibold flex items-center justify-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400" />
              {parseFloat(boutique.rating).toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Followers</p>
            <p className="font-semibold">{boutique.followerCount}</p>
          </div>
        </div>

        {/* Category */}
        {boutique.category && (
          <div className="flex flex-wrap gap-1">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {boutique.category}
            </span>
            {boutique.subcategories?.slice(0, 2).map((sub: string) => (
              <span key={sub} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                {sub}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1" onClick={() => handleVisitBoutique(boutique.id)}>
            <ExternalLink className="w-4 h-4 mr-1" />
            Visit Boutique
          </Button>
          {boutique.tryOnEnabled && (
            <Button size="sm" variant="outline">
              <Zap className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-600 to-orange-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">Discover Fashion Boutiques</h1>
          <p className="text-pink-100">
            Find your favorite boutiques and experience virtual try-ons with StyleSwap
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      {statsQuery.data?.stats && (
        <div className="bg-gray-50 border-b">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-muted-foreground text-sm">Total Boutiques</p>
                <p className="text-2xl font-bold">{statsQuery.data.stats.totalBoutiques}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Available Items</p>
                <p className="text-2xl font-bold">{statsQuery.data.stats.totalItems.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Community Members</p>
                <p className="text-2xl font-bold">{statsQuery.data.stats.totalFollowers.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Average Rating</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400" />
                  {statsQuery.data.stats.avgRating}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Search and Filter */}
        <div className="space-y-4 mb-8">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search boutiques..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Location Filter */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <select
              value={selectedCountry || ""}
              onChange={(e) => {
                setSelectedCountry(e.target.value || undefined);
                setSelectedCity(undefined);
              }}
              className="p-2 border rounded text-sm"
            >
              <option value="">All Countries</option>
              {countriesQuery.data?.countries.map((country: string) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>

            {selectedCountry && (
              <select
                value={selectedCity || ""}
                onChange={(e) => setSelectedCity(e.target.value || undefined)}
                className="p-2 border rounded text-sm"
              >
                <option value="">All Cities</option>
                {citiesQuery.data?.cities.map((city: string) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value || undefined)}
              className="p-2 border rounded text-sm"
            >
              <option value="">All Categories</option>
              {categoriesQuery.data?.categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2">
            <Button
              variant={sortBy === "popular" ? "default" : "outline"}
              onClick={() => setSortBy("popular")}
              size="sm"
            >
              <Users className="w-4 h-4 mr-1" />
              Popular
            </Button>
            <Button
              variant={sortBy === "trending" ? "default" : "outline"}
              onClick={() => setSortBy("trending")}
              size="sm"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Trending
            </Button>
            <Button
              variant={sortBy === "rating" ? "default" : "outline"}
              onClick={() => setSortBy("rating")}
              size="sm"
            >
              <Star className="w-4 h-4 mr-1" />
              Top Rated
            </Button>
            <Button
              variant={sortBy === "newest" ? "default" : "outline"}
              onClick={() => setSortBy("newest")}
              size="sm"
            >
              Newest
            </Button>
          </div>
        </div>

        {/* Featured Section */}
        {featuredQuery.data?.boutiques.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-6 h-6" />
              Featured Boutiques
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {featuredQuery.data.boutiques.map((boutique: any) => (
                <BoutiqueCard key={boutique.id} boutique={boutique} featured />
              ))}
            </div>
          </div>
        )}

        {/* Trending Section */}
        {trendingQuery.data?.boutiques.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6" />
              Trending Now
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {trendingQuery.data.boutiques.map((boutique: any) => (
                <BoutiqueCard key={boutique.id} boutique={boutique} />
              ))}
            </div>
          </div>
        )}

        {/* All Boutiques */}
        <div>
          <h2 className="text-2xl font-bold mb-4">All Boutiques</h2>
          {boutiquesQuery.isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading boutiques...</p>
            </div>
          ) : boutiquesQuery.data?.items.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-lg font-semibold mb-2">No boutiques found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {boutiquesQuery.data?.items.map((boutique: any) => (
                  <BoutiqueCard key={boutique.id} boutique={boutique} />
                ))}
              </div>

              {/* Pagination */}
              {boutiquesQuery.data?.hasMore && (
                <div className="text-center">
                  <Button variant="outline">Load More</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
