import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
    businessType: 'boutique'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast.success('Thank you! We\'ll be in touch soon.');
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        message: '',
        businessType: 'boutique'
      });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <section className="py-20 container mx-auto">
      <div className="grid lg:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div className="space-y-8">
          <div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6">GET IN TOUCH</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Ready to transform your fashion retail business? Our team is here to help you implement StyleSwap and maximize your ROI.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 text-primary mt-1">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Email</h3>
                <p className="text-muted-foreground">info@styleswap.co.za</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 text-primary mt-1">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Phone</h3>
                <p className="text-muted-foreground">060 855 5621</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 text-primary mt-1">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Location</h3>
                <p className="text-muted-foreground">Johannesburg, South Africa</p>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 rounded-lg">
            <h3 className="font-bold mb-3">Response Time</h3>
            <p className="text-sm text-muted-foreground">
              We typically respond to inquiries within 24 hours during business days.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <Card className="premium-card rounded-2xl">
          <CardHeader>
            <CardTitle>Send us a Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-lg border border-border/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-lg border border-border/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Company</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Your company"
                    className="w-full px-4 py-3 rounded-lg border border-border/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+27 (0) 10 123 4567"
                    className="w-full px-4 py-3 rounded-lg border border-border/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Business Type</label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-border/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                >
                  <option value="boutique">Fashion Boutique</option>
                  <option value="fastfashion">Fast Fashion Retailer</option>
                  <option value="luxury">Luxury Brand</option>
                  <option value="ecommerce">E-commerce Store</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your business and how StyleSwap can help..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-border/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full premium-button bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-lg font-bold"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'} <Send className="ml-2 w-4 h-4" />
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                We respect your privacy. Your information will only be used to contact you about StyleSwap.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
