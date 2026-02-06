import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";

export default function TermsAndConditions() {
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
          <h1 className="text-4xl md:text-5xl font-bold">Terms and Conditions</h1>
          <p className="text-primary-foreground/80 mt-2">Last updated: February 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-invert max-w-none space-y-8">
          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using the StyleSwap platform (the "Service"), you agree to be bound by these Terms and Conditions. If you do not agree to any part of these terms, you may not use the Service. StyleSwap reserves the right to modify these terms at any time. Your continued use of the Service following the posting of revised terms means that you accept and agree to the changes.
            </p>
          </section>

          {/* 2. Service Description */}
          <section>
            <h2 className="text-2xl font-bold mb-4">2. Service Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              StyleSwap provides AI-powered virtual try-on technology that allows customers to visualize clothing items on their own body using either augmented reality (AR) or by uploading personal photos. The Service is provided on an "as-is" basis for entertainment and shopping assistance purposes.
            </p>
          </section>

          {/* 3. Credit Purchase and Payment */}
          <section>
            <h2 className="text-2xl font-bold mb-4">3. Credit Purchase and Payment</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">3.1 Non-Refundable Credits</h3>
                <p className="leading-relaxed">
                  All credit purchases are final and non-refundable. Credits are issued immediately upon successful payment and cannot be returned, exchanged for cash, or transferred to other accounts. You are responsible for ensuring you purchase the correct amount of credits for your needs.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">3.2 Credit Expiration</h3>
                <p className="leading-relaxed">
                  Credits do not expire and remain valid for the duration of your account. However, StyleSwap reserves the right to deactivate inactive accounts after 12 months of no activity, which may result in loss of unused credits.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">3.3 Payment Processing</h3>
                <p className="leading-relaxed">
                  Payments are processed through our secure payment gateway. By making a purchase, you authorize StyleSwap to charge your payment method for the selected credit package. You are responsible for maintaining accurate payment information.
                </p>
              </div>
            </div>
          </section>

          {/* 4. User Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold mb-4">4. User Responsibilities</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>You agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Provide accurate and complete information when creating your account</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Use the Service only for lawful purposes and in accordance with these Terms</li>
                <li>Not upload or generate content that is illegal, offensive, or violates third-party rights</li>
                <li>Not attempt to reverse-engineer, decompile, or hack the Service</li>
                <li>Not use the Service for commercial purposes without explicit permission</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </div>
          </section>

          {/* 5. Intellectual Property Rights */}
          <section>
            <h2 className="text-2xl font-bold mb-4">5. Intellectual Property Rights</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">5.1 StyleSwap Intellectual Property</h3>
                <p className="leading-relaxed">
                  All content, features, and functionality of the StyleSwap Service, including but not limited to software, algorithms, and designs, are owned by StyleSwap or its licensors and are protected by international copyright, trademark, and other intellectual property laws.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">5.2 User-Generated Content</h3>
                <p className="leading-relaxed">
                  You retain ownership of any photos or content you upload to the Service. By uploading content, you grant StyleSwap a non-exclusive, royalty-free license to use, reproduce, and display your content solely for the purpose of providing the Service and improving our algorithms.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">5.3 Generated Try-On Results</h3>
                <p className="leading-relaxed">
                  Try-on results generated by StyleSwap are provided for personal, non-commercial use only. You may not use generated images for commercial purposes, resale, or distribution without explicit written permission from StyleSwap.
                </p>
              </div>
            </div>
          </section>

          {/* 6. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold mb-4">6. Limitation of Liability</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, STYLESWAP SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL, EVEN IF STYLESWAP HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p>
                StyleSwap's total liability for any claim arising from or relating to the Service shall not exceed the amount you paid for the credits that are the subject of the claim.
              </p>
            </div>
          </section>

          {/* 7. Disclaimer of Warranties */}
          <section>
            <h2 className="text-2xl font-bold mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS. STYLESWAP DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. STYLESWAP DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>
          </section>

          {/* 8. Indemnification */}
          <section>
            <h2 className="text-2xl font-bold mb-4">8. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify, defend, and hold harmless StyleSwap and its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including attorney's fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          {/* 9. Account Termination */}
          <section>
            <h2 className="text-2xl font-bold mb-4">9. Account Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              StyleSwap reserves the right to suspend or terminate your account at any time for violation of these Terms, illegal activity, or other conduct that StyleSwap deems harmful to the Service or other users. Upon termination, your right to use the Service immediately ceases, and any unused credits are forfeited.
            </p>
          </section>

          {/* 10. Privacy and Data Protection */}
          <section>
            <h2 className="text-2xl font-bold mb-4">10. Privacy and Data Protection</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices regarding the collection and use of your personal information.
            </p>
          </section>

          {/* 11. Third-Party Links */}
          <section>
            <h2 className="text-2xl font-bold mb-4">11. Third-Party Links</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service may contain links to third-party websites and services. StyleSwap is not responsible for the content, accuracy, or practices of these external sites. Your use of third-party services is governed by their respective terms and conditions.
            </p>
          </section>

          {/* 12. Governing Law */}
          <section>
            <h2 className="text-2xl font-bold mb-4">12. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms and Conditions are governed by and construed in accordance with the laws of South Africa, without regard to its conflict of law provisions. You agree to submit to the exclusive jurisdiction of the courts located in South Africa.
            </p>
          </section>

          {/* 13. Severability */}
          <section>
            <h2 className="text-2xl font-bold mb-4">13. Severability</h2>
            <p className="text-muted-foreground leading-relaxed">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect, and the invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable.
            </p>
          </section>

          {/* 14. Contact Information */}
          <section>
            <h2 className="text-2xl font-bold mb-4">14. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms and Conditions, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-secondary/10 rounded-lg">
              <p className="font-semibold text-foreground">StyleSwap Support</p>
              <p className="text-muted-foreground">Email: support@styleswap.com</p>
              <p className="text-muted-foreground">Website: www.styleswap.com</p>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              By using StyleSwap, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
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
    </div>
  );
}
