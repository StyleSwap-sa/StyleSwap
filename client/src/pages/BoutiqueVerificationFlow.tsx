import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Clock, FileUp, Smartphone, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Boutique Verification Flow Component
 * Guides boutique owners through verification process
 * Supports both formal business and social media seller verification
 */

export default function BoutiqueVerificationFlow() {
  const [step, setStep] = useState(0);
  const [verificationType, setVerificationType] = useState<"formal_business" | "social_media" | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [linkedSocialAccounts, setLinkedSocialAccounts] = useState<string[]>([]);

  const steps = [
    { title: "Choose Verification Type", icon: Shield },
    { title: "Submit Documents", icon: FileUp },
    { title: "Link Social Media", icon: Smartphone },
    { title: "Review & Submit", icon: CheckCircle2 },
  ];

  const handleVerificationTypeSelect = (type: "formal_business" | "social_media") => {
    setVerificationType(type);
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Boutique Verification</h1>
          <p className="text-xl text-muted-foreground">
            Get verified to build trust with customers and unlock premium features
          </p>
        </div>

        {/* Progress Indicator */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                {steps.map((s, i) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        i <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className="text-xs text-center">{s.title}</span>
                  </div>
                ))}
              </div>
              <Progress value={(step / (steps.length - 1)) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Choose Verification Type */}
        {step === 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Formal Business */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleVerificationTypeSelect("formal_business")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Formal Business
                </CardTitle>
                <CardDescription>For registered businesses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Requirements:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✓ Government ID or Passport</li>
                    <li>✓ Business License</li>
                    <li>✓ Tax Registration</li>
                    <li>✓ Address Proof</li>
                    <li>✓ Bank Account</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Benefits:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✓ Green verified badge</li>
                    <li>✓ Featured listing</li>
                    <li>✓ Higher trust score</li>
                    <li>✓ Priority support</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Social Media Seller */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleVerificationTypeSelect("social_media")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Social Media Seller
                </CardTitle>
                <CardDescription>For social media entrepreneurs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Requirements:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✓ Government ID</li>
                    <li>✓ Address Proof</li>
                    <li>✓ Social Media Account (3+ months old)</li>
                    <li>✓ 100+ followers</li>
                    <li>✓ Sales history evidence</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Benefits:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✓ Verified seller badge</li>
                    <li>✓ Standard listing</li>
                    <li>✓ Customer trust</li>
                    <li>✓ Growth opportunities</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 1.5: Formal Business Documents */}
        {step === 1 && verificationType === "formal_business" && (
          <Card>
            <CardHeader>
              <CardTitle>Submit Required Documents</CardTitle>
              <CardDescription>Upload clear, legible copies of your documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <DocumentUploadSection
                title="Government ID"
                description="Passport, Driver's License, or National ID"
                accepted={["government_id", "passport", "drivers_license"]}
                uploaded={uploadedDocuments}
                onUpload={(doc) => setUploadedDocuments([...uploadedDocuments, doc])}
              />

              <DocumentUploadSection
                title="Business License"
                description="Official business registration document"
                accepted={["business_license"]}
                uploaded={uploadedDocuments}
                onUpload={(doc) => setUploadedDocuments([...uploadedDocuments, doc])}
              />

              <DocumentUploadSection
                title="Tax Registration"
                description="Tax ID or business tax registration"
                accepted={["tax_registration"]}
                uploaded={uploadedDocuments}
                onUpload={(doc) => setUploadedDocuments([...uploadedDocuments, doc])}
              />

              <DocumentUploadSection
                title="Address Proof"
                description="Utility bill, lease agreement, or bank statement (within 3 months)"
                accepted={["utility_bill", "lease_agreement", "bank_statement"]}
                uploaded={uploadedDocuments}
                onUpload={(doc) => setUploadedDocuments([...uploadedDocuments, doc])}
              />

              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button onClick={() => setStep(2)} disabled={uploadedDocuments.length < 4}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1.5: Social Media Documents */}
        {step === 1 && verificationType === "social_media" && (
          <Card>
            <CardHeader>
              <CardTitle>Submit Required Documents</CardTitle>
              <CardDescription>Verify your identity and sales history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <DocumentUploadSection
                title="Government ID"
                description="Passport, Driver's License, or National ID"
                accepted={["government_id", "passport", "drivers_license"]}
                uploaded={uploadedDocuments}
                onUpload={(doc) => setUploadedDocuments([...uploadedDocuments, doc])}
              />

              <DocumentUploadSection
                title="Address Proof"
                description="Utility bill, lease agreement, or bank statement"
                accepted={["utility_bill", "lease_agreement", "bank_statement"]}
                uploaded={uploadedDocuments}
                onUpload={(doc) => setUploadedDocuments([...uploadedDocuments, doc])}
              />

              <DocumentUploadSection
                title="Sales Evidence"
                description="Screenshots of customer DMs, orders, or reviews"
                accepted={["customer_dm", "order_screenshot", "customer_testimonial"]}
                uploaded={uploadedDocuments}
                onUpload={(doc) => setUploadedDocuments([...uploadedDocuments, doc])}
              />

              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button onClick={() => setStep(2)} disabled={uploadedDocuments.length < 3}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Link Social Media */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Link Your Social Media Accounts</CardTitle>
              <CardDescription>Help customers find and verify you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SocialMediaLinkSection
                platform="Instagram"
                icon="📷"
                linked={linkedSocialAccounts}
                onLink={(account) => setLinkedSocialAccounts([...linkedSocialAccounts, account])}
              />

              <SocialMediaLinkSection
                platform="TikTok"
                icon="🎵"
                linked={linkedSocialAccounts}
                onLink={(account) => setLinkedSocialAccounts([...linkedSocialAccounts, account])}
              />

              <SocialMediaLinkSection
                platform="Facebook"
                icon="👥"
                linked={linkedSocialAccounts}
                onLink={(account) => setLinkedSocialAccounts([...linkedSocialAccounts, account])}
              />

              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>Please review your information before submitting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Verification Type</h4>
                  <p className="text-sm text-muted-foreground">
                    {verificationType === "formal_business" ? "Formal Business" : "Social Media Seller"}
                  </p>
                </div>

                <div className="bg-secondary/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Documents Uploaded</h4>
                  <p className="text-sm text-muted-foreground">{uploadedDocuments.length} documents</p>
                </div>

                <div className="bg-secondary/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Social Media Accounts</h4>
                  <p className="text-sm text-muted-foreground">{linkedSocialAccounts.length} accounts linked</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">What happens next?</p>
                  <p>
                    Our team will review your submission within 2-5 business days. You'll receive an email
                    notification once your verification is complete.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={() => submitVerification()} className="flex-1">
                  Submit for Verification
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {step === 4 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">Verification Submitted!</h3>
                <p className="text-green-800">
                  Thank you for submitting your verification. Our team will review your application within 2-5 business days.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 text-left space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="text-sm">Expected decision: 2-5 business days</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm">You'll receive an email notification</span>
                </div>
              </div>
              <Button onClick={() => window.location.href = "/boutique/dashboard"}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/**
 * Document Upload Section Component
 */
function DocumentUploadSection({
  title,
  description,
  accepted,
  uploaded,
  onUpload,
}: {
  title: string;
  description: string;
  accepted: string[];
  uploaded: string[];
  onUpload: (doc: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="space-y-2">
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          // Handle file drop
          onUpload(title);
        }}
      >
        <FileUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium">Drag and drop your file here</p>
        <p className="text-xs text-muted-foreground">or</p>
        <Button variant="outline" size="sm" className="mt-2">
          Browse Files
        </Button>
        <p className="text-xs text-muted-foreground mt-2">PDF, JPG, PNG (Max 10MB)</p>
      </div>
      {uploaded.includes(title) && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          Document uploaded
        </div>
      )}
    </div>
  );
}

/**
 * Social Media Link Section Component
 */
function SocialMediaLinkSection({
  platform,
  icon,
  linked,
  onLink,
}: {
  platform: string;
  icon: string;
  linked: string[];
  onLink: (account: string) => void;
}) {
  const [username, setUsername] = useState("");

  return (
    <div className="space-y-2">
      <label className="font-semibold flex items-center gap-2">
        <span>{icon}</span>
        {platform}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={`Your ${platform} username`}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
        />
        <Button
          size="sm"
          onClick={() => {
            if (username) {
              onLink(platform);
              setUsername("");
            }
          }}
        >
          Link
        </Button>
      </div>
      {linked.includes(platform) && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          {platform} account linked
        </div>
      )}
    </div>
  );
}

/**
 * Submit verification (placeholder)
 */
function submitVerification() {
  // TODO: Call backend verification mutation
  console.log("Submitting verification...");
}
