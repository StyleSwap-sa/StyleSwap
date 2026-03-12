import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, ArrowRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * Enterprise Retail Pro Pricing Page
 * Displays pricing tiers and handles contact requests
 */

export default function EnterprisePricing() {
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'annual'>('monthly');
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    businessType: '',
    itemCount: '',
    monthlyTryOns: '',
    message: '',
  });

  // Fetch pricing tiers
  const { data: pricingData } = trpc.enterprise.getPricingTiers.useQuery();
  
  // Submit contact request
  const submitContactMutation = trpc.enterprise.submitContactRequest.useMutation({
    onSuccess: () => {
      alert('Thank you! Our sales team will contact you soon.');
      setShowContactForm(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        businessType: '',
        itemCount: '',
        monthlyTryOns: '',
        message: '',
      });
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitContactMutation.mutateAsync({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      company: formData.company,
      businessType: formData.businessType || undefined,
      itemCount: formData.itemCount ? parseInt(formData.itemCount) : undefined,
      monthlyTryOns: formData.monthlyTryOns ? parseInt(formData.monthlyTryOns) : undefined,
      message: formData.message || undefined,
      interestedFeatures: [],
    });
  };

  const tiers = pricingData?.tiers || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      {/* Header */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            StyleSwap for <span className="text-primary">Boutiques</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your fashion retail business. From startups to enterprise retailers.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-secondary/20 rounded-lg p-1 flex gap-2">
            <button
              onClick={() => setSelectedBilling('monthly')}
              className={`px-6 py-2 rounded transition ${
                selectedBilling === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-secondary/20'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setSelectedBilling('annual')}
              className={`px-6 py-2 rounded transition relative ${
                selectedBilling === 'annual'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-secondary/20'
              }`}
            >
              Annual Billing
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier, index) => (
            <Card
              key={tier.id}
              className={`relative transition-all ${
                tier.id === 'enterprise' ? 'md:scale-105 border-primary shadow-2xl' : ''
              }`}
            >
              {tier.id === 'enterprise' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="space-y-2">
                  {tier.monthlyPrice !== null ? (
                    <>
                      <div className="text-4xl font-bold">
                        R{selectedBilling === 'monthly' ? tier.monthlyPrice : tier.annualPrice}
                        <span className="text-lg text-muted-foreground">/month</span>
                      </div>
                      {selectedBilling === 'annual' && (
                        <p className="text-sm text-green-600">
                          Billed R{tier.annualPrice} annually
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-primary">{tier.pricing}</div>
                      <p className="text-sm text-muted-foreground">Contact for quote</p>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <FeatureItem
                    included={tier.features.fullApiIntegration}
                    text="Full API integration"
                  />
                  <FeatureItem
                    included={tier.features.whiteLabelOption}
                    text="White-label option"
                  />
                  <FeatureItem
                    included={tier.features.dedicatedAccountManager}
                    text="Dedicated account manager"
                  />
                  <FeatureItem
                    included={tier.features.customSla}
                    text="Custom SLA & support"
                  />
                  <FeatureItem
                    included={tier.features.priorityFeatureRequests}
                    text="Priority feature requests"
                  />
                  <FeatureItem
                    included={tier.features.customIntegrations}
                    text="Custom integrations"
                  />
                  <FeatureItem
                    included={true}
                    text={`API Rate Limit: ${
                      tier.features.apiRateLimit === -1
                        ? 'Unlimited'
                        : `${tier.features.apiRateLimit}/min`
                    }`}
                  />
                  <FeatureItem
                    included={true}
                    text={`Max Items: ${
                      tier.features.maxItems === -1 ? 'Unlimited' : tier.features.maxItems
                    }`}
                  />
                  <FeatureItem
                    included={true}
                    text={`Team Members: ${
                      tier.features.maxUsers === -1 ? 'Unlimited' : tier.features.maxUsers
                    }`}
                  />
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full"
                  variant={tier.id === 'enterprise' ? 'default' : 'outline'}
                  onClick={() => {
                    if (tier.id === 'enterprise') {
                      setShowContactForm(true);
                    }
                  }}
                >
                  {tier.cta}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-card rounded-lg border p-8 mb-16">
          <h2 className="text-3xl font-bold mb-8">Detailed Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-bold">Feature</th>
                  <th className="text-center py-4 px-4 font-bold">Starter</th>
                  <th className="text-center py-4 px-4 font-bold">Professional</th>
                  <th className="text-center py-4 px-4 font-bold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'API Integration', starter: false, pro: true, enterprise: true },
                  { name: 'White-Label', starter: false, pro: false, enterprise: true },
                  { name: 'Dedicated Account Manager', starter: false, pro: false, enterprise: true },
                  { name: 'Custom SLA', starter: false, pro: false, enterprise: true },
                  { name: 'Priority Feature Requests', starter: false, pro: false, enterprise: true },
                  { name: 'Custom Integrations', starter: false, pro: false, enterprise: true },
                  { name: 'Webhook Support', starter: false, pro: true, enterprise: true },
                  { name: 'Advanced Analytics', starter: false, pro: true, enterprise: true },
                  { name: 'Priority Support', starter: false, pro: false, enterprise: true },
                  { name: '24/7 Support', starter: false, pro: false, enterprise: true },
                ].map((feature) => (
                  <tr key={feature.name} className="border-b hover:bg-secondary/5">
                    <td className="py-4 px-4">{feature.name}</td>
                    <td className="text-center py-4 px-4">
                      {feature.starter ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {feature.pro ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {feature.enterprise ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I upgrade or downgrade my plan?',
                a: 'Yes, you can change your plan anytime. Changes take effect at the next billing cycle.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, bank transfers, and digital wallets.',
              },
              {
                q: 'Is there a setup fee?',
                a: 'No setup fees. You only pay the monthly subscription price.',
              },
              {
                q: 'What is included in the Enterprise plan?',
                a: 'The Enterprise plan includes full API access, white-label options, dedicated account manager, custom SLA, and 24/7 support.',
              },
            ].map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Contact Sales</CardTitle>
              <CardDescription>
                Tell us about your business and we'll get back to you within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitContact} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Company *</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                      placeholder="Your company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                      placeholder="+27 123 456 7890"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Business Type</label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="">Select...</option>
                      <option value="boutique">Boutique</option>
                      <option value="chain">Retail Chain</option>
                      <option value="ecommerce">E-commerce</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Items</label>
                    <input
                      type="number"
                      name="itemCount"
                      value={formData.itemCount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                      placeholder="e.g., 5000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Expected Monthly Try-Ons</label>
                  <input
                    type="number"
                    name="monthlyTryOns"
                    value={formData.monthlyTryOns}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    placeholder="e.g., 10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    placeholder="Tell us about your needs..."
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={submitContactMutation.isPending}
                    className="flex-1"
                  >
                    {submitContactMutation.isPending ? 'Sending...' : 'Send Inquiry'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowContactForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Feature list item component
 */
function FeatureItem({ included, text }: { included: boolean; text: string }) {
  return (
    <div className="flex items-center gap-3">
      {included ? (
        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
      ) : (
        <X className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      )}
      <span className={included ? 'text-foreground' : 'text-muted-foreground line-through'}>
        {text}
      </span>
    </div>
  );
}
