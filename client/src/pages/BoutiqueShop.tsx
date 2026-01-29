import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Heart, Share2, ShoppingBag, Sparkles, Search, Filter, Loader2, MapPin, Phone, Mail, Instagram, Facebook, MessageCircle } from "lucide-react";

interface Product {
  id: number;
  name: string;
  image: string;
  price: number;
  category: string;
  description?: string;
}

export default function BoutiqueShop() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch boutique details
  const { data: boutique, isLoading: boutiqueLoding } = trpc.boutiques.getBoutiqueBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  // Fetch boutique products
  const { data: products = [], isLoading: productsLoading } = trpc.boutiques.getBoutiqueProducts.useQuery(
    { boutiqueId: boutique?.id || 0 },
    { enabled: !!boutique?.id }
  );

  const filteredProducts = products.filter((p: Product) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map((p: Product) => p.category)));

  const handleTryOn = (product: Product) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setSelectedProduct(product);
    // Navigate to try-on with product context
    navigate(`/customer-try-on?boutique=${boutique?.id}&product=${product.id}`);
  };

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: boutique?.name || "Boutique",
        text: `Check out ${boutique?.name} on StyleSwap!`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  if (boutiqueLoding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!boutique) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Boutique Not Found</h2>
            <p className="text-muted-foreground mb-4">The boutique you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/")} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Boutique Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Boutique Logo/Image */}
            {boutique.logo && (
              <img
                src={boutique.logo}
                alt={boutique.name}
                className="w-24 h-24 rounded-lg object-cover"
              />
            )}

            {/* Boutique Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{boutique.name}</h1>
              <p className="text-muted-foreground mb-4">{boutique.description}</p>

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 mb-4">
                {boutique.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{boutique.location}</span>
                  </div>
                )}
                {boutique.phone && (
                  <a href={`tel:${boutique.phone}`} className="flex items-center gap-2 text-sm hover:text-primary">
                    <Phone className="w-4 h-4" />
                    <span>{boutique.phone}</span>
                  </a>
                )}
                {boutique.email && (
                  <a href={`mailto:${boutique.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
                    <Mail className="w-4 h-4" />
                    <span>{boutique.email}</span>
                  </a>
                )}
              </div>

              {/* Social Media Links */}
              <div className="flex gap-3">
                {boutique.instagramHandle && (
                  <a
                    href={`https://instagram.com/${boutique.instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-primary/10 rounded-lg transition"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {boutique.facebookUrl && (
                  <a
                    href={boutique.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-primary/10 rounded-lg transition"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {boutique.whatsappNumber && (
                  <a
                    href={`https://wa.me/${boutique.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-primary/10 rounded-lg transition"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                )}
                <Button size="sm" variant="outline" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 py-12">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background"
              />
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product: Product) => (
              <Card key={product.id} className="premium-card overflow-hidden hover:shadow-lg transition">
                {/* Product Image */}
                <div className="relative aspect-square bg-muted overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition"
                  />
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-2 right-2 p-2 bg-background/80 rounded-full hover:bg-background transition"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        favorites.includes(product.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                </div>

                {/* Product Info */}
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    {product.category}
                  </p>
                  <h3 className="font-bold mb-2 line-clamp-2">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold">R{product.price.toFixed(2)}</span>
                  </div>

                  {/* Try On Button */}
                  <Button
                    onClick={() => handleTryOn(product)}
                    className="w-full"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Try On
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-muted/50 border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <h4 className="font-bold mb-3">About {boutique.name}</h4>
              <p className="text-sm text-muted-foreground">{boutique.description}</p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-bold mb-3">Stay Updated</h4>
              <p className="text-sm text-muted-foreground mb-3">Subscribe for new collections and offers</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 border border-input rounded text-sm bg-background"
                />
                <Button size="sm">Subscribe</Button>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} {boutique.name}. All rights reserved. Powered by StyleSwap</p>
          </div>
        </div>
      </div>
    </div>
  );
}
