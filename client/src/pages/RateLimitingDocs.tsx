import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Zap, TrendingUp } from "lucide-react";

export default function RateLimitingDocs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">Rate Limiting & Quotas</h1>
          <p className="text-xl text-slate-600 max-w-3xl">
            Understand how StyleSwap API rate limiting works and how to handle rate limit responses in your integration.
          </p>
        </div>

        {/* Overview Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-600" />
                Rate Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                All API requests are rate limited to ensure fair access and system stability.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="font-mono text-sm text-slate-900">
                  <strong>100 requests per minute</strong> per API key
                </p>
              </div>
              <p className="text-sm text-slate-600">
                This limit applies to all endpoints and is calculated using a sliding window algorithm.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Quotas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                Monthly quotas limit total API usage per billing period.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                  <span className="text-sm font-medium">Starter Plan</span>
                  <span className="font-mono text-sm">10,000 req/month</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                  <span className="text-sm font-medium">Professional Plan</span>
                  <span className="font-mono text-sm">100,000 req/month</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                  <span className="text-sm font-medium">Enterprise Plan</span>
                  <span className="font-mono text-sm">Custom</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rate Limit Headers */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Rate Limit Response Headers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-slate-600">
              Every API response includes headers that show your current rate limit status:
            </p>
            
            <div className="space-y-4">
              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto">
                <pre>{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1707547200`}</pre>
              </div>

              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="font-semibold text-slate-900">X-RateLimit-Limit</p>
                  <p className="text-sm text-slate-600">Maximum requests allowed per minute (100)</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="font-semibold text-slate-900">X-RateLimit-Remaining</p>
                  <p className="text-sm text-slate-600">Number of requests remaining in current window</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="font-semibold text-slate-900">X-RateLimit-Reset</p>
                  <p className="text-sm text-slate-600">Unix timestamp when the rate limit window resets</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Handling Rate Limits */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Handling Rate Limit Errors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-slate-600">
              When you exceed the rate limit, you'll receive a 429 (Too Many Requests) response:
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="font-mono text-sm text-red-900 mb-3">
                <strong>HTTP 429 Too Many Requests</strong>
              </div>
              <pre className="bg-red-900 text-red-100 p-3 rounded text-xs overflow-auto">
{`{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Rate limit exceeded. Max 100 requests per minute. Retry after 23 seconds."
  }
}`}
              </pre>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">Best Practices:</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">Implement exponential backoff when retrying failed requests</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">Monitor X-RateLimit-Remaining header to avoid hitting limits</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">Batch requests when possible to reduce total API calls</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">Cache responses to avoid redundant API calls</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Code Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Node.js - Handling Rate Limits</h4>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto">
                <pre>{`async function makeApiRequest(url, options, retries = 3) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-API-Key': process.env.STYLESWAP_API_KEY,
        ...options.headers
      }
    });

    // Check rate limit headers
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    
    console.log(\`Requests remaining: \${remaining}\`);

    if (response.status === 429) {
      const retryAfter = parseInt(reset) * 1000 - Date.now();
      console.log(\`Rate limited. Retrying in \${retryAfter}ms\`);
      
      await new Promise(resolve => setTimeout(resolve, retryAfter));
      return makeApiRequest(url, options, retries - 1);
    }

    return response.json();
  } catch (error) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000 * (4 - retries)));
      return makeApiRequest(url, options, retries - 1);
    }
    throw error;
  }
}`}</pre>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Python - Monitoring Rate Limits</h4>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto">
                <pre>{`import requests
import time

def make_api_request(url, headers=None):
    if headers is None:
        headers = {}
    
    headers['X-API-Key'] = os.getenv('STYLESWAP_API_KEY')
    
    response = requests.get(url, headers=headers)
    
    # Check rate limit headers
    remaining = response.headers.get('X-RateLimit-Remaining')
    reset_time = response.headers.get('X-RateLimit-Reset')
    
    print(f"Requests remaining: {remaining}")
    
    if response.status_code == 429:
        retry_after = int(reset_time) - time.time()
        print(f"Rate limited. Waiting {retry_after} seconds...")
        time.sleep(retry_after + 1)
        return make_api_request(url, headers)
    
    return response.json()`}</pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">What happens if I exceed my monthly quota?</h4>
              <p className="text-slate-600">
                Your API key will be temporarily disabled. Contact our support team to upgrade your plan or request a quota increase.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Can I get a higher rate limit?</h4>
              <p className="text-slate-600">
                Yes! Enterprise customers can request custom rate limits. Contact our sales team at sales@styleswap.com to discuss your needs.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">How is the sliding window calculated?</h4>
              <p className="text-slate-600">
                The rate limit is calculated over a rolling 60-second window. Each request is timestamped, and we count requests from the last 60 seconds. This provides more flexibility than fixed windows.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Do batch requests count differently?</h4>
              <p className="text-slate-600">
                No, each API call counts as one request regardless of batch size. However, batching can help you process more data with fewer total requests.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">What's the best way to handle rate limits in production?</h4>
              <p className="text-slate-600">
                Implement exponential backoff, monitor the X-RateLimit-Remaining header, cache responses when possible, and consider using a queue system to spread requests over time.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Need Help with Rate Limiting?</h3>
          <p className="mb-6 text-orange-100">
            Our API documentation and support team are here to help you optimize your integration.
          </p>
          <div className="flex gap-4">
            <Button className="bg-white text-orange-600 hover:bg-orange-50">
              View API Docs
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-orange-700">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
