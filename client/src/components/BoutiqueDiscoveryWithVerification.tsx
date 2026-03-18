import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  Star,
  TrendingUp,
  Shield,
  Search,
  Filter,
  Grid,
  List,
} from 'lucide-react';
import { BoutiqueTrustIndicators, VerificationBadge, TrustScoreBar } from './BoutiqueTrustIndicators';
import { trpc } from '@/lib/trpc';

/**
 * Boutique Discovery with Verification Integration
 * Displays boutiques with verification status, trust scores, and customer reviews
 */

export default function BoutiqueDiscoveryWithVerification() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trust-score');
  const [filterVerified, setFilterVerified] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);

  // Fetch boutiques with verification data
  const { data: boutiques, isLoading } = trpc.boutiqueDiscovery.getBoutiquesWithVerification.useQuery(
    {
      search: searchQuery,
      sortBy,
      filterVerified,
      page,
      limit: 12,
    },
    { enabled: true }
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleSort = (value: string) => {
    setSortBy(value);
    setPage(1);
  };

  const handleFilter = (value: string) => {
    setFilterVerified(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Discover Boutiques</h1>
          <p className="text-muted-foreground">
            Find verified boutiques offering AI-powered virtual try-ons
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-4 flex-col md:flex-row">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search boutiques..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10"
                />
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={handleSort}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trust-score">Trust Score (High to Low)</SelectItem>
                  <SelectItem value="rating">Customer Rating</SelectItem>
                  <SelectItem value="transactions">Most Transactions</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter */}
              <Select value={filterVerified} onValueChange={handleFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Boutiques</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="high-trust">High Trust (85+)</SelectItem>
                  <SelectItem value="social-media">Social Media Sellers</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex gap-2 border border-border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Active Filters Display */}
            <div className="flex gap-2 flex-wrap">
              {searchQuery && (
                <Badge variant="secondary">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery('')} className="ml-2">
                    ✕
                  </button>
                </Badge>
              )}
              {filterVerified !== 'all' && (
                <Badge variant="secondary">
                  Filter: {filterVerified}
                  <button onClick={() => setFilterVerified('all')} className="ml-2">
                    ✕
                  </button>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Boutiques Grid/List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
            <p className="mt-4 text-muted-foreground">Loading boutiques...</p>
          </div>
        ) : boutiques && boutiques.length > 0 ? (
          <>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {boutiques.map((boutique: any) => (
                <BoutiqueCard key={boutique.id} boutique={boutique} viewMode={viewMode} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Page {page}</span>
              </div>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={!boutiques || boutiques.length < 12}
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No boutiques found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual Boutique Card Component
 */
function BoutiqueCard({
  boutique,
  viewMode,
}: {
  boutique: any;
  viewMode: 'grid' | 'list';
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      {/* Header with Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
        {boutique.logo && (
          <img
            src={boutique.logo}
            alt={boutique.name}
            className="w-full h-full object-cover"
          />
        )}
        {boutique.verificationStatus === 'approved' && (
          <div className="absolute top-3 right-3">
            <VerificationBadge
              status={boutique.verificationStatus}
              trustScore={boutique.trustScore}
            />
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Boutique Info */}
        <div>
          <h3 className="font-bold text-lg mb-1">{boutique.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{boutique.description}</p>
        </div>

        {/* Trust Indicators */}
        {viewMode === 'grid' ? (
          <div className="space-y-3">
            {/* Trust Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Trust Score</span>
                <span className="text-sm font-bold">{boutique.trustScore}/100</span>
              </div>
              <TrustScoreBar score={boutique.trustScore} showLabel={false} />
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{boutique.averageRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({boutique.totalReviews})</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {boutique.totalTransactions} sales
              </div>
            </div>

            {/* Verification Status */}
            {boutique.verificationStatus === 'approved' && (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-green-900 text-xs">
                <CheckCircle2 className="w-4 h-4" />
                Verified Boutique
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Trust</div>
              <div className="font-bold">{boutique.trustScore}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Rating</div>
              <div className="font-bold">{boutique.averageRating.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Reviews</div>
              <div className="font-bold">{boutique.totalReviews}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Sales</div>
              <div className="font-bold">{boutique.totalTransactions}</div>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <Button className="w-full" variant="default">
          View Boutique
        </Button>
      </CardContent>
    </Card>
  );
}
