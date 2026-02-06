import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Footer } from "@/components/Footer";

export default function RefundPolicy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 mb-4 hover:opacity-80 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-4xl md:text-5xl font-bold">Refund Policy</h1>
          <p className="text-primary-foreground/80 mt-2">Last updated: February 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Non-Refundable Credits</h2>
            <p className="text-muted-foreground leading-relaxed">
              All credits purchased on StyleSwap are final and non-refundable. Once you have completed your purchase and received your credits, they cannot be returned, exchanged for cash, or transferred to another account. This policy applies to all credit packages regardless of the amount purchased.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Billing Errors</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                If you believe you have been charged in error, please contact our support team within 30 days of the transaction. We will investigate your claim and, if an error is found, will either:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Issue a refund to your original payment method, or</li>
                <li>Provide additional credits to compensate for the error</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Fraudulent Transactions</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you believe your account has been compromised or a transaction was made without your authorization, please contact us immediately. We will investigate and take appropriate action, which may include issuing a refund if fraud is confirmed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Service Unavailability</h2>
            <p className="text-muted-foreground leading-relaxed">
              If StyleSwap service is unavailable for an extended period due to technical issues beyond your control, and you are unable to use your purchased credits, please contact our support team. We will work with you to find an appropriate resolution, which may include service credits or a refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Account Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              If your account is terminated due to violation of our Terms and Conditions, any unused credits will be forfeited and no refund will be issued. If your account is terminated due to our error or system failure, we may provide compensation in the form of service credits.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Credit Expiration</h2>
            <p className="text-muted-foreground leading-relaxed">
              Credits do not expire and remain valid for the lifetime of your account. However, if your account is inactive for 12 months or more, StyleSwap reserves the right to deactivate your account and forfeit any unused credits. No refund will be issued in this case.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Refund Request Process</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>To request a refund for a billing error or fraudulent transaction:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Contact our support team at support@styleswap.co.za</li>
                <li>Provide your account details and transaction information</li>
                <li>Explain the reason for your refund request</li>
                <li>Provide any supporting documentation</li>
                <li>We will review your request within 5-7 business days</li>
                <li>If approved, the refund will be processed to your original payment method within 10-14 business days</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Chargeback Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you initiate a chargeback through your payment provider without first contacting our support team, your account may be suspended or terminated. We encourage you to contact us first to resolve any billing disputes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Special Promotions</h2>
            <p className="text-muted-foreground leading-relaxed">
              Credits purchased during special promotions or with discount codes are subject to the same refund policy. Promotional credits cannot be refunded separately from regular credits.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Contact Support</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have questions about our refund policy or need to report a billing issue, please contact us:
            </p>
            <div className="p-4 bg-secondary/10 rounded-lg">
              <p className="font-semibold text-foreground">StyleSwap Support Team</p>
              <p className="text-muted-foreground">Email: support@styleswap.co.za</p>
              <p className="text-muted-foreground">Hours: Monday to Friday, 9am - 5pm CAT</p>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              This Refund Policy was last updated on February 6, 2026. StyleSwap reserves the right to modify this policy at any time.
            </p>
            <Button
              onClick={() => setLocation("/")}
              className="mt-6"
              variant="default"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
