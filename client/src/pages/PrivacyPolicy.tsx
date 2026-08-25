import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
          <p className="text-primary-foreground/80 mt-2">Last updated: August 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              StyleSwap ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">2.1 Personal Information</h3>
                <p className="leading-relaxed">
                  We collect information you provide directly, such as when you create an account, make a purchase, or contact us. This may include your name, email address, phone number, payment information, and billing address.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">2.2 Photos and Content</h3>
                <p className="leading-relaxed">
                  When you use our virtual try-on service, photos are simply sent to our virtual try-on technology provider to produce the result.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">2.3 Usage Data</h3>
                <p className="leading-relaxed">
                  We automatically collect information about your interactions with our Service, including IP address, browser type, pages visited, and time spent on pages.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the information we collect for various purposes, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li>Providing, maintaining, and improving our Service</li>
              <li>Processing transactions and sending related information</li>
              <li>Sending promotional communications (with your consent)</li>
              <li>Responding to your inquiries and customer support requests</li>
              <li>Analyzing usage patterns to improve user experience</li>
              <li>Detecting and preventing fraudulent transactions</li>
              <li>Complying with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as necessary to provide our Service and fulfill the purposes outlined in this Privacy Policy. You may request deletion of your data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Third-Party Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. We may share information with service providers who assist us in operating our website and conducting our business, subject to confidentiality agreements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Your Rights</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                In accordance with the Protection of Personal Information Act (POPIA), you may have the right to access the personal information we hold about you, request correction or deletion of inaccurate or unnecessary personal information, object to certain processing of your personal information, and withdraw consent where processing is based on consent.
              </p>
              <p>
                To exercise any of these rights, please contact us using the details provided below. Users outside South Africa may also have additional privacy rights under the laws applicable in their jurisdiction.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience on our Service. You can control cookie settings through your browser preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="p-4 bg-secondary/10 rounded-lg">
              <p className="font-semibold text-foreground">StyleSwap Support Team</p>
              <p className="text-muted-foreground">Email: support@styleswap.co.za</p>
              <p className="text-muted-foreground">Location: Johannesburg, South Africa</p>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              This Privacy Policy was last updated on August 2026. We may update this policy from time to time.
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