import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Clock, FileText, User } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

/**
 * Boutique Signup with Mandatory Verification
 * Integrates boutique registration with verification requirements
 */

export default function BoutiqueSignupWithVerification() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'signup' | 'verification' | 'success'>('signup');
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    businessType: 'formal', // 'formal' or 'social_media'
  });

  const [verificationData, setVerificationData] = useState({
    verificationType: 'formal',
    documents: [] as File[],
    socialMediaAccounts: [] as { platform: string; url: string }[],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boutique, setBoutique] = useState<any>(null);

  // Create boutique mutation
  const createBoutiqueMutation = trpc.boutiques.create.useMutation({
    onSuccess: (data) => {
      setBoutique(data);
      setStep('verification');
    },
    onError: (err) => {
      setError(err.message || 'Failed to create boutique');
    },
  });

  // Submit verification mutation
  const submitVerificationMutation = trpc.verification.submitForVerification.useMutation({
    onSuccess: () => {
      setStep('success');
    },
    onError: (err) => {
      setError(err.message || 'Failed to submit verification');
    },
  });

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      createBoutiqueMutation.mutate({
        name: formData.businessName,
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        businessType: formData.businessType,
      });
    } catch (err) {
      setError('Failed to create boutique account');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!boutique) {
        setError('Boutique not found');
        return;
      }

      submitVerificationMutation.mutate({
        boutiqueId: boutique.id,
        verificationType: verificationData.verificationType,
        documents: verificationData.documents,
        socialMediaAccounts: verificationData.socialMediaAccounts,
      });
    } catch (err) {
      setError('Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setVerificationData({
      ...verificationData,
      documents: [...verificationData.documents, ...files],
    });
  };

  const handleAddSocialMedia = (platform: string, url: string) => {
    setVerificationData({
      ...verificationData,
      socialMediaAccounts: [
        ...verificationData.socialMediaAccounts,
        { platform, url },
      ],
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${step === 'signup' ? 'text-primary' : 'text-muted-foreground'}`}>
              <User className="w-5 h-5" />
              <span className="font-medium">Create Account</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-border" />
            <div className={`flex items-center gap-2 ${step === 'verification' || step === 'success' ? 'text-primary' : 'text-muted-foreground'}`}>
              <FileText className="w-5 h-5" />
              <span className="font-medium">Verification</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-border" />
            <div className={`flex items-center gap-2 ${step === 'success' ? 'text-primary' : 'text-muted-foreground'}`}>
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Complete</span>
            </div>
          </div>
        </div>

        {/* Step 1: Signup */}
        {step === 'signup' && (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Boutique Account</CardTitle>
              <CardDescription>
                Join StyleSwap and start offering AI-powered virtual try-ons to your customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignupSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Name</label>
                  <Input
                    placeholder="Your boutique name"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Owner Name</label>
                  <Input
                    placeholder="Your full name"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Business Type</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-secondary/50">
                      <input
                        type="radio"
                        name="businessType"
                        value="formal"
                        checked={formData.businessType === 'formal'}
                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      />
                      <div>
                        <div className="font-medium">Registered Business</div>
                        <div className="text-sm text-muted-foreground">With business license and tax registration</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-secondary/50">
                      <input
                        type="radio"
                        name="businessType"
                        value="social_media"
                        checked={formData.businessType === 'social_media'}
                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      />
                      <div>
                        <div className="font-medium">Social Media Seller</div>
                        <div className="text-sm text-muted-foreground">Selling on Instagram, TikTok, or Facebook</div>
                      </div>
                    </label>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account & Continue'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Verification */}
        {step === 'verification' && boutique && (
          <Card>
            <CardHeader>
              <CardTitle>Verify Your Boutique</CardTitle>
              <CardDescription>
                Complete the verification process to unlock all features and build customer trust
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerificationSubmit} className="space-y-6">
                <Tabs
                  value={verificationData.verificationType}
                  onValueChange={(value) =>
                    setVerificationData({ ...verificationData, verificationType: value })
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="formal">Formal Business</TabsTrigger>
                    <TabsTrigger value="social_media">Social Media</TabsTrigger>
                  </TabsList>

                  <TabsContent value="formal" className="space-y-4">
                    <div className="space-y-3">
                      <h3 className="font-medium">Required Documents</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Government ID (Passport, Driver's License)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Business License or Tax Registration
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Proof of Address (Utility Bill, Lease)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Bank Account for Payouts
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Upload Documents</label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition">
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <div className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            PNG, JPG, PDF up to 10MB each
                          </div>
                        </label>
                      </div>

                      {verificationData.documents.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Uploaded Files:</p>
                          {verificationData.documents.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-secondary/50 rounded">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">{file.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="social_media" className="space-y-4">
                    <div className="space-y-3">
                      <h3 className="font-medium">Required Information</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Government ID
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Proof of Address
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Social Media Account Links (3+ months old)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Sales Evidence (Screenshots, Reviews)
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium">Link Your Social Media Accounts</label>
                      <div className="space-y-2">
                        {['Instagram', 'TikTok', 'Facebook'].map((platform) => (
                          <div key={platform} className="flex gap-2">
                            <Input
                              placeholder={`Your ${platform} URL`}
                              defaultValue=""
                              onBlur={(e) => {
                                if (e.target.value) {
                                  handleAddSocialMedia(platform, e.target.value);
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep('signup')}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit for Verification'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                Verification Submitted!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-medium">What Happens Next?</h3>
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 bg-secondary/50 rounded-lg">
                    <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Review Period: 2-5 Business Days</div>
                      <div className="text-sm text-muted-foreground">Our team will review your documents</div>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 bg-secondary/50 rounded-lg">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Email Notifications</div>
                      <div className="text-sm text-muted-foreground">We'll send updates to your registered email</div>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 bg-secondary/50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Verified Badge</div>
                      <div className="text-sm text-muted-foreground">Once approved, you'll get a verified badge</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">In the Meantime</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Set up your API keys in the Developer Portal</li>
                  <li>• Review our API documentation</li>
                  <li>• Prepare your product catalog</li>
                  <li>• Test the widget builder</li>
                </ul>
              </div>

              <Button
                className="w-full"
                onClick={() => navigate('/developer')}
              >
                Go to Developer Portal
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
