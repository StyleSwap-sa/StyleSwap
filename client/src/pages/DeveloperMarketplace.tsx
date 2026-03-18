import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Star, Download, Github, ExternalLink, Zap, TrendingUp, Award } from "lucide-react";
import { toast } from "sonner";

export default function DeveloperMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "rating">("newest");
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  // Form state for new integration
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    websiteUrl: "",
    githubUrl: "",
    documentationUrl: "",
  });

  // Fetch data
  const categoriesQuery = trpc.developerMarketplace.getCategories.useQuery();
  const integrationsQuery = trpc.developerMarketplace.listIntegrations.useQuery({
    search: searchQuery,
    category: selectedCategory,
    sortBy,
  });
  const featuredQuery = trpc.developerMarketplace.getFeaturedIntegrations.useQuery();
  const trendingQuery = trpc.developerMarketplace.getTrendingIntegrations.useQuery();
  const topRatedQuery = trpc.developerMarketplace.getTopRatedIntegrations.useQuery();

  // Submit integration mutation
  const submitMutation = trpc.developerMarketplace.submitIntegration.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setFormData({
          name: "",
          description: "",
          category: "",
          websiteUrl: "",
          githubUrl: "",
          documentationUrl: "",
        });
        setIsSubmitDialogOpen(false);
        integrationsQuery.refetch();
      } else {
        toast.error(data.error || "Failed to submit integration");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    await submitMutation.mutateAsync({
      developerId: 1, // TODO: Get from auth context
      ...formData,
      features: [],
      tags: [],
    });
  };

  const IntegrationCard = ({ integration }: { integration: any }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {integration.logoUrl && (
              <img src={integration.logoUrl} alt={integration.name} className="w-12 h-12 rounded mb-2" />
            )}
            <CardTitle className="text-lg">{integration.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{integration.category}</p>
          </div>
          {integration.isVerified && (
            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
              ✓ Verified
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{integration.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="text-muted-foreground">Downloads</p>
            <p className="font-semibold">{integration.downloadCount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Rating</p>
            <p className="font-semibold flex items-center justify-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400" />
              {parseFloat(integration.rating).toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Reviews</p>
            <p className="font-semibold">{integration.reviewCount}</p>
          </div>
        </div>

        {/* Features */}
        {integration.features && integration.features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {integration.features.slice(0, 3).map((feature: string) => (
              <span key={feature} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                {feature}
              </span>
            ))}
            {integration.features.length > 3 && (
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                +{integration.features.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1">
            <ExternalLink className="w-4 h-4 mr-1" />
            View
          </Button>
          {integration.githubUrl && (
            <Button size="sm" variant="outline" asChild>
              <a href={integration.githubUrl} target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">Developer Integration Marketplace</h1>
          <p className="text-blue-100">
            Discover and share StyleSwap API integrations built by the community
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Search and Filter */}
        <div className="space-y-4 mb-8">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Integration
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Submit Your Integration</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Integration Name *</label>
                    <Input
                      placeholder="My Awesome Integration"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description *</label>
                    <textarea
                      placeholder="Describe what your integration does..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2 border rounded mt-1 text-sm"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-2 border rounded mt-1 text-sm"
                    >
                      <option value="">Select a category</option>
                      {categoriesQuery.data?.categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Website URL</label>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">GitHub Repository</label>
                    <Input
                      type="url"
                      placeholder="https://github.com/..."
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Documentation URL</label>
                    <Input
                      type="url"
                      placeholder="https://docs.example.com"
                      value={formData.documentationUrl}
                      onChange={(e) => setFormData({ ...formData, documentationUrl: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                    className="w-full"
                  >
                    {submitMutation.isPending ? "Submitting..." : "Submit Integration"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={!selectedCategory ? "default" : "outline"}
              onClick={() => setSelectedCategory(undefined)}
              size="sm"
            >
              All
            </Button>
            {categoriesQuery.data?.categories.map((cat: any) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                size="sm"
              >
                {cat.icon} {cat.name}
              </Button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex gap-2">
            <Button
              variant={sortBy === "newest" ? "default" : "outline"}
              onClick={() => setSortBy("newest")}
              size="sm"
            >
              Newest
            </Button>
            <Button
              variant={sortBy === "popular" ? "default" : "outline"}
              onClick={() => setSortBy("popular")}
              size="sm"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Popular
            </Button>
            <Button
              variant={sortBy === "rating" ? "default" : "outline"}
              onClick={() => setSortBy("rating")}
              size="sm"
            >
              <Star className="w-4 h-4 mr-1" />
              Top Rated
            </Button>
          </div>
        </div>

        {/* Featured Section */}
        {featuredQuery.data?.integrations.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-6 h-6" />
              Featured Integrations
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {featuredQuery.data.integrations.map((integration: any) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          </div>
        )}

        {/* Trending Section */}
        {trendingQuery.data?.integrations.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6" />
              Trending Now
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {trendingQuery.data.integrations.map((integration: any) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          </div>
        )}

        {/* All Integrations */}
        <div>
          <h2 className="text-2xl font-bold mb-4">All Integrations</h2>
          {integrationsQuery.isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading integrations...</p>
            </div>
          ) : integrationsQuery.data?.items.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-lg font-semibold mb-2">No integrations found</p>
                <p className="text-sm text-muted-foreground">
                  Be the first to submit an integration!
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {integrationsQuery.data?.items.map((integration: any) => (
                  <IntegrationCard key={integration.id} integration={integration} />
                ))}
              </div>

              {/* Pagination */}
              {integrationsQuery.data?.hasMore && (
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
