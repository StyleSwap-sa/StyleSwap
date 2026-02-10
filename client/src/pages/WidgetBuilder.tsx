import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, Eye } from 'lucide-react';
import { StyleSwapWidget } from '@/components/StyleSwapWidget';

export default function WidgetBuilder() {
  const [apiKey, setApiKey] = useState('sk_test_your_api_key');
  const [productId, setProductId] = useState('prod_123');
  const [productName, setProductName] = useState('Beautiful Dress');
  const [primaryColor, setPrimaryColor] = useState('#FF6B35');
  const [accentColor, setAccentColor] = useState('#004E89');
  const [containerWidth, setContainerWidth] = useState('100%');
  const [copied, setCopied] = useState(false);

  const embedCode = `<!-- StyleSwap Widget Embed -->
<div id="styleswap-widget-container"></div>

<script src="https://styleswap.com/widget.js"></script>
<script>
  StyleSwapWidget.init({
    apiKey: "${apiKey}",
    productId: "${productId}",
    productName: "${productName}",
    primaryColor: "${primaryColor}",
    accentColor: "${accentColor}",
    containerId: "styleswap-widget-container",
    onTryOnComplete: function(result) {
      console.log("Try-on completed:", result);
      // Handle try-on result
    }
  });
</script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Widget Builder</h1>
          <p className="text-gray-600">Customize and generate embed code for your StyleSwap widget</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk_test_..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Get your API key from the Developer Portal</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Product ID</label>
                  <input
                    type="text"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="prod_123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Product Name</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Product name"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Styling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Accent Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Container Width</label>
                  <input
                    type="text"
                    value={containerWidth}
                    onChange={(e) => setContainerWidth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100%, 400px, etc."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Embed Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-auto max-h-64">
                  <pre>{embedCode}</pre>
                </div>
                <Button
                  onClick={copyToClipboard}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check size={18} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy Code
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye size={20} />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <StyleSwapWidget
                    apiKey={apiKey}
                    productId={productId}
                    productName={productName}
                    primaryColor={primaryColor}
                    accentColor={accentColor}
                    containerWidth="100%"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Installation Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">For Shopify:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600">
                    <li>Go to your product page template</li>
                    <li>Add the embed code above</li>
                    <li>Save and publish</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">For WooCommerce:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600">
                    <li>Edit your product page</li>
                    <li>Switch to HTML mode</li>
                    <li>Paste the embed code</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">For Custom Sites:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600">
                    <li>Add the embed code to your HTML</li>
                    <li>Update the API key and product ID</li>
                    <li>Customize colors to match your brand</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
