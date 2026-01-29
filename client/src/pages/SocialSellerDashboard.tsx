import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Share2, QrCode, TrendingUp, Users, ShoppingBag, MessageSquare, Copy, Check, Instagram, Facebook, Music, MessageCircle, Link as LinkIcon } from "lucide-react";

export default function SocialSellerDashboard() {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  // Fetch user's boutique
  const { data: boutiques } = trpc.boutiques.myBoutiques.useQuery();
  const boutique = boutiques?.[0];

  if (!boutique) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold">Social Media Seller Dashboard</h1>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">No boutique found. Please create one first.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const shopUrl = `${window.location.origin}/boutique/${boutique.slug}/shop`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shopUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Social Media Seller Dashboard</h1>
          <p className="text-muted-foreground">
            Sell your products directly through social media without needing a website
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="premium-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Shop Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-2">This month</p>
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Try-Ons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-2">This month</p>
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inquiries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-2">Pending</p>
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Followers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-2">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Your Shop Link */}
        <Card className="premium-card border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Your Shop Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this link on your social media to let customers discover and try on your products
            </p>

            {/* URL Display */}
            <div className="flex items-center gap-2 bg-background p-3 rounded border border-border">
              <code className="text-xs flex-1 overflow-x-auto">{shopUrl}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyUrl}
              >
                {copiedUrl ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* QR Code */}
            <div className="space-y-2">
              <Button
                onClick={() => setShowQRCode(!showQRCode)}
                variant="outline"
                className="w-full"
              >
                <QrCode className="w-4 h-4 mr-2" />
                {showQRCode ? "Hide" : "Show"} QR Code
              </Button>

              {showQRCode && (
                <div className="p-4 bg-white rounded-lg flex justify-center">
                  <div className="w-48 h-48 bg-muted rounded flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">QR Code will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Social Media Integration */}
        <Card className="premium-card">
          <CardHeader>
            <CardTitle>Connect Your Social Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Link your social media accounts to make it easy for customers to find you
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Instagram */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Instagram className="w-5 h-5 text-pink-600" />
                  <h4 className="font-bold">Instagram</h4>
                </div>
                {boutique.instagramHandle ? (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Connected:</p>
                    <p className="font-medium">@{boutique.instagramHandle}</p>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full">
                    Connect Instagram
                  </Button>
                )}
              </div>

              {/* TikTok */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  <h4 className="font-bold">TikTok</h4>
                </div>
                {boutique.tiktokHandle ? (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Connected:</p>
                    <p className="font-medium">@{boutique.tiktokHandle}</p>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full">
                    Connect TikTok
                  </Button>
                )}
              </div>

              {/* Facebook */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold">Facebook</h4>
                </div>
                {boutique.facebookUrl ? (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Connected</p>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full">
                    Connect Facebook
                  </Button>
                )}
              </div>

              {/* WhatsApp */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-bold">WhatsApp</h4>
                </div>
                {boutique.whatsappNumber ? (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Connected:</p>
                    <p className="font-medium">{boutique.whatsappNumber}</p>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full">
                    Add WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sharing Templates */}
        <Card className="premium-card">
          <CardHeader>
            <CardTitle>Social Media Post Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copy and paste these templates to share your shop on social media
            </p>

            <div className="space-y-3">
              {/* Instagram Template */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-bold text-sm">Instagram Caption</h4>
                <div className="bg-background p-3 rounded text-sm space-y-2">
                  <p>✨ Try on our latest collection with AI! 🤖</p>
                  <p>See how our clothes look on YOU before you buy!</p>
                  <p>Link in bio 👆</p>
                  <p>#VirtualTryOn #StyleSwap #FashionTech</p>
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>

              {/* TikTok Template */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-bold text-sm">TikTok Caption</h4>
                <div className="bg-background p-3 rounded text-sm space-y-2">
                  <p>POV: You can try on clothes before buying 👀</p>
                  <p>Link in bio to try on our collection!</p>
                  <p>#VirtualTryOn #FashionTech #Shopping</p>
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>

              {/* WhatsApp Template */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-bold text-sm">WhatsApp Message</h4>
                <div className="bg-background p-3 rounded text-sm space-y-2">
                  <p>Hey! 👋 Check out our new collection with virtual try-on!</p>
                  <p>Try before you buy: {shopUrl}</p>
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="premium-card bg-gradient-to-r from-secondary/10 to-primary/10">
          <CardHeader>
            <CardTitle>💡 Tips for Social Sellers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="font-bold text-primary">1.</span>
              <p>Post your shop link regularly on Instagram Stories, TikTok, and Reels to drive traffic</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-primary">2.</span>
              <p>Create videos showing customers trying on your clothes with our AI technology</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-primary">3.</span>
              <p>Use the QR code in your bio or product photos for easy access</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-primary">4.</span>
              <p>Respond quickly to WhatsApp inquiries to convert browsers into buyers</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-primary">5.</span>
              <p>Encourage customers to tag you in their try-on videos for social proof</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
