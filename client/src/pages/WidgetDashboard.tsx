import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Download, ExternalLink, Code2, BookOpen } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useRoute } from 'wouter';

export default function WidgetDashboard() {
  const { user } = useAuth();
  const [, params] = useRoute('/boutique/:boutiqueId/widget');
  const boutiqueId = params?.boutiqueId;
  const [copied, setCopied] = useState(false);

  // Generate widget ID (in production, this would come from the backend)
  const widgetId = `widget_${boutiqueId}_${Date.now()}`;

  // Generate widget code
  const widgetCode = `<!-- StyleSwap Virtual Try-On Widget -->
<div id="styleswap-widget"></div>
<script>
  window.StyleSwapWidget = {
    widgetId: '${widgetId}',
    containerId: 'styleswap-widget',
    primaryColor: '#FF6B35',
    accentColor: '#004E89'
  };
</script>
<script src="https://styleswap.co.za/styleswap-widget.js"></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(widgetCode));
    element.setAttribute('download', 'styleswap-widget.html');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Widget Integration</h1>
          <p className="text-muted-foreground">
            Embed StyleSwap virtual try-on on your website in seconds
          </p>
        </div>

        {/* Quick Start */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              Quick Start (3 Steps)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Copy the code below</h3>
                  <p className="text-sm text-muted-foreground">Click "Copy Code" button to copy the widget code</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Paste into your website</h3>
                  <p className="text-sm text-muted-foreground">Paste the code into your product page HTML</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Done!</h3>
                  <p className="text-sm text-muted-foreground">Your customers can now try on your products virtually</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget Code */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Widget Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre className="text-foreground">{widgetCode}</pre>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={copyToClipboard}
                variant="default"
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
              <Button
                onClick={downloadCode}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download HTML
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Installation Guides */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Shopify */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shopify</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">1.</span>
                  <span>Go to your Shopify admin → Online Store → Themes</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">2.</span>
                  <span>Click "Edit code" on your active theme</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">3.</span>
                  <span>Find the product template file (product.liquid)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">4.</span>
                  <span>Paste the widget code where you want it to appear</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">5.</span>
                  <span>Save and publish</span>
                </li>
              </ol>
              <Button variant="outline" className="w-full text-sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Shopify Help
              </Button>
            </CardContent>
          </Card>

          {/* WordPress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">WordPress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">1.</span>
                  <span>Go to your WordPress admin → Pages/Posts</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">2.</span>
                  <span>Edit the product page</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">3.</span>
                  <span>Switch to "Code" or "HTML" editor</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">4.</span>
                  <span>Paste the widget code</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">5.</span>
                  <span>Update/Publish</span>
                </li>
              </ol>
              <Button variant="outline" className="w-full text-sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                WordPress Help
              </Button>
            </CardContent>
          </Card>

          {/* Custom Website */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom Website</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">1.</span>
                  <span>Open your website HTML file</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">2.</span>
                  <span>Find the product section</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">3.</span>
                  <span>Paste the widget code</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">4.</span>
                  <span>Save and upload to your server</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">5.</span>
                  <span>Test on your live website</span>
                </li>
              </ol>
              <Button variant="outline" className="w-full text-sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                HTML Help
              </Button>
            </CardContent>
          </Card>

          {/* WooCommerce */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">WooCommerce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">1.</span>
                  <span>Go to WordPress admin → Products</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">2.</span>
                  <span>Edit your product</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">3.</span>
                  <span>Scroll to "Product data" section</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">4.</span>
                  <span>Add widget code to product description</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-fit">5.</span>
                  <span>Update product</span>
                </li>
              </ol>
              <Button variant="outline" className="w-full text-sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                WooCommerce Help
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              FAQ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Do I need technical skills?</h3>
              <p className="text-sm text-muted-foreground">
                No! Just copy and paste the code. If you're using Shopify, WordPress, or WooCommerce, we have step-by-step guides.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Will it slow down my website?</h3>
              <p className="text-sm text-muted-foreground">
                No. The widget loads asynchronously and only when customers interact with it.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I customize the colors?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! Change the primaryColor and accentColor values in the code to match your brand.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How do I track usage?</h3>
              <p className="text-sm text-muted-foreground">
                The widget sends analytics to your StyleSwap dashboard. You can see impressions, clicks, and try-ons.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What if I need help?</h3>
              <p className="text-sm text-muted-foreground">
                Contact our support team at support@styleswap.co.za or use the chat in your dashboard.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Widget Preview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Widget preview will appear here when embedded on your website
              </p>
              <div id="styleswap-widget-preview" className="max-w-sm mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
