import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, CheckCircle, Upload, Settings, BarChart3, DollarSign } from "lucide-react";

export default function BoutiqueTutorial() {
  const [expandedSection, setExpandedSection] = useState<string | null>("getting-started");

  const tutorials = [
    {
      id: "getting-started",
      title: "Getting Started with StyleSwap",
      icon: <CheckCircle className="w-6 h-6" />,
      steps: [
        {
          number: 1,
          title: "Sign Up as a Boutique Partner",
          description: "Create your boutique account on StyleSwap. You'll receive a dashboard login and API credentials.",
        },
        {
          number: 2,
          title: "Complete Your Boutique Profile",
          description: "Add your boutique name, logo, description, and contact information. This helps customers identify your shop.",
        },
        {
          number: 3,
          title: "Set Up Your Catalog",
          description: "Upload your clothing items with images. StyleSwap will use these for virtual try-on generation.",
        },
        {
          number: 4,
          title: "Configure Try-On Settings",
          description: "Choose which garment types you want to offer (tops, bottoms, dresses, etc.) and set your pricing.",
        },
      ],
    },
    {
      id: "upload-products",
      title: "Uploading Products for Try-On",
      icon: <Upload className="w-6 h-6" />,
      steps: [
        {
          number: 1,
          title: "Prepare Your Images",
          description: "Use high-quality, clear images of your clothing items. Flat-lay or on-model photos work best.",
        },
        {
          number: 2,
          title: "Upload to Dashboard",
          description: "Go to the Products section and click 'Add Product'. Upload your image and fill in product details.",
        },
        {
          number: 3,
          title: "Select Garment Type",
          description: "Choose whether the item is a top, bottom, or full-body garment. This ensures accurate try-on generation.",
        },
        {
          number: 4,
          title: "Set Pricing for Try-Ons",
          description: "Decide how much you want to charge customers for virtual try-ons of this product (optional).",
        },
        {
          number: 5,
          title: "Publish Product",
          description: "Click 'Publish' to make your product available for customers to try on.",
        },
      ],
    },
    {
      id: "manage-dashboard",
      title: "Managing Your Dashboard",
      icon: <Settings className="w-6 h-6" />,
      steps: [
        {
          number: 1,
          title: "Monitor Try-On Activity",
          description: "View real-time data on how many customers are trying on your products.",
        },
        {
          number: 2,
          title: "Track Conversions",
          description: "See which products have the highest try-on to purchase conversion rates.",
        },
        {
          number: 3,
          title: "Manage Inventory",
          description: "Update product availability and manage stock levels directly from the dashboard.",
        },
        {
          number: 4,
          title: "View Customer Feedback",
          description: "Read reviews and feedback from customers who used the virtual try-on feature.",
        },
      ],
    },
    {
      id: "analytics",
      title: "Understanding Your Analytics",
      icon: <BarChart3 className="w-6 h-6" />,
      steps: [
        {
          number: 1,
          title: "Try-On Metrics",
          description: "Track total try-ons, unique users, and average try-ons per user to understand engagement.",
        },
        {
          number: 2,
          title: "Conversion Rate",
          description: "See what percentage of try-ons result in purchases. Compare across products to optimize your catalog.",
        },
        {
          number: 3,
          title: "Popular Products",
          description: "Identify which items get the most try-ons and which have the best conversion rates.",
        },
        {
          number: 4,
          title: "Customer Demographics",
          description: "Understand who is trying on your products (age, location, device type).",
        },
      ],
    },
    {
      id: "payouts",
      title: "Payouts and Billing",
      icon: <DollarSign className="w-6 h-6" />,
      steps: [
        {
          number: 1,
          title: "Understand the Pricing Model",
          description: "StyleSwap charges per try-on. You set your own price, and we handle the billing.",
        },
        {
          number: 2,
          title: "View Your Earnings",
          description: "Check your earnings dashboard to see revenue from try-ons and purchases.",
        },
        {
          number: 3,
          title: "Set Up Payouts",
          description: "Configure your bank account or payment method for monthly payouts.",
        },
        {
          number: 4,
          title: "Download Reports",
          description: "Export detailed financial reports for your accounting and business analysis.",
        },
      ],
    },
  ];

  const faqs = [
    {
      question: "How much does it cost to use StyleSwap?",
      answer: "StyleSwap charges a small per-try-on fee. You can set your own pricing for customers, and we handle the payment processing. There are no monthly subscription fees.",
    },
    {
      question: "What image formats are supported?",
      answer: "We support JPG, PNG, and WebP formats. Images should be at least 500x500 pixels for best results.",
    },
    {
      question: "How long does it take to generate a try-on?",
      answer: "Most try-ons are generated within 10-30 seconds. Complex images may take up to 60 seconds.",
    },
    {
      question: "Can customers share their try-on results?",
      answer: "Yes! Customers can share try-on images on social media, which helps drive traffic back to your store.",
    },
    {
      question: "What if a try-on fails?",
      answer: "If a try-on fails, the customer's credits are automatically refunded. Our support team is available 24/7 to help.",
    },
    {
      question: "Can I customize the try-on experience?",
      answer: "Yes, you can customize colors, add your branding, and adjust settings in the dashboard.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Boutique Partner Guide</h1>
          <p className="text-lg text-primary-foreground/90">
            Learn how to maximize StyleSwap for your boutique and increase conversions
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Tutorial Sections */}
        <div className="space-y-6 mb-16">
          {tutorials.map((tutorial) => (
            <Card
              key={tutorial.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() =>
                setExpandedSection(
                  expandedSection === tutorial.id ? null : tutorial.id
                )
              }
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-primary">{tutorial.icon}</div>
                    <CardTitle className="text-xl">{tutorial.title}</CardTitle>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                      expandedSection === tutorial.id ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </CardHeader>

              {expandedSection === tutorial.id && (
                <CardContent className="space-y-6">
                  {tutorial.steps.map((step) => (
                    <div key={step.number} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                          {step.number}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-2">
                          {step.title}
                        </h4>
                        <p className="text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join hundreds of boutiques already using StyleSwap to increase conversions and reduce returns.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Sign Up Now
            </Button>
            <Button variant="outline">Contact Support</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
