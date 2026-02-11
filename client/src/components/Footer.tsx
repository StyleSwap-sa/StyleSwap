import { Link } from "wouter";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground/5 border-t border-border/20 py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SS</span>
              </div>
              <span className="font-heading font-bold text-lg">
                Style<span className="text-primary">Swap</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered virtual fitting room technology for modern fashion retail.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/pricing" className="hover:text-primary transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/try-on" className="hover:text-primary transition">
                  Try Now
                </Link>
              </li>
              <li>
                <a href="/#technology" className="hover:text-primary transition">
                  Technology
                </a>
              </li>
              <li>
                <a href="/#case-studies" className="hover:text-primary transition">
                  Case Studies
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/#overview" className="hover:text-primary transition">
                  About
                </a>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition">
                  Contact
                </Link>
              </li>
              <li>
                <a href="/#market" className="hover:text-primary transition">
                  Blog
                </a>
              </li>
              <li>
                <Link href="/b2b" className="hover:text-primary transition">
                  For Boutiques
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms-and-conditions" className="hover:text-primary transition">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-primary transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-primary transition">
                  Refund Policy
                </Link>
              </li>
              <li>
                <a href="mailto:support@styleswap.co.za" className="hover:text-primary transition">
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/20 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4">Get in Touch</h4>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <a href="mailto:info@styleswap.co.za" className="hover:text-primary transition">
                  info@styleswap.co.za
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Johannesburg, South Africa</span>
              </div>
            </div>

            {/* Copyright */}
            <div className="flex flex-col justify-end">
              <p className="text-sm text-muted-foreground text-right">
                © {currentYear} StyleSwap. All rights reserved.
              </p>
              <p className="text-xs text-muted-foreground/60 text-right mt-2">
                Built with AI-powered virtual fitting room technology
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
