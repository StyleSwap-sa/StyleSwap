import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, Camera, Shirt, Zap, Share2, AlertCircle } from "lucide-react";

export default function CustomerTutorial() {
  const [expandedSection, setExpandedSection] = useState<string | null>("how-it-works");

  const tutorials = [
    {
      id: "how-it-works",
      title: "How Virtual Try-On Works",
      icon: <Zap className="w-6 h-6" />,
      steps: [
        {
          number: 1,
          title: "Upload Your Photo",
          description: "Take a clear photo of yourself wearing fitted clothes. A full-body shot works best for accurate results.",
        },
        {
          number: 2,
          title: "Select a Garment",
          description: "Choose a top, bottom, or dress from the boutique's catalog that you want to try on.",
        },
        {
          number: 3,
          title: "Choose Garment Type",
          description: "Specify whether you want to try on the top or bottom from the selected item (if applicable).",
        },
        {
          number: 4,
          title: "AI Generates Try-On",
          description: "Our AI technology creates a realistic preview of how the garment looks on you in seconds.",
        },
        {
          number: 5,
          title: "View & Share Results",
          description: "See the result, compare with your original photo, and share on social media if you like it.",
        },
      ],
    },
    {
      id: "taking-photos",
      title: "Taking the Perfect Photo",
      icon: <Camera className="w-6 h-6" />,
      steps: [
        {
          number: 1,
          title: "Wear Fitted Clothes",
          description: "Wear tight-fitting clothes (leggings, fitted shirt) so the AI can accurately map your body shape.",
        },
        {
          number: 2,
          title: "Full Body Shot",
          description: "Take a photo from head to toe. Make sure your entire body is visible in the frame.",
        },
        {
          number: 3,
          title: "Good Lighting",
          description: "Use natural lighting or well-lit indoor spaces. Avoid shadows and backlighting.",
        },
        {
          number: 4,
          title: "Neutral Background",
          description: "A plain or simple background works best. Busy backgrounds can affect accuracy.",
        },
        {
          number: 5,
          title: "Face the Camera",
          description: "Stand facing the camera directly. Avoid extreme angles or poses.",
        },
        {
          number: 6,
          title: "High Quality Image",
          description: "Use a high-resolution camera or smartphone. Blurry images may not generate accurate try-ons.",
        },
      ],
    },
    {
      id: "selecting-garments",
      title: "Selecting Garments to Try On",
      icon: <Shirt className="w-6 h-6" />,
      steps: [
        {
          number: 1,
          title: "Browse Boutique Catalog",
          description: "Explore the clothing items available from your favorite boutiques.",
        },
        {
          number: 2,
          title: "Check Product Details",
          description: "Read descriptions, see available sizes, colors, and prices before trying on.",
        },
        {
          number: 3,
          title: "Select Top or Bottom",
          description: "For items with multiple parts, choose whether you want to try on the top or bottom.",
        },
        {
          number: 4,
          title: "Confirm Selection",
          description: "Review your choice and confirm before the AI starts generating the try-on.",
        },
      ],
    },
    {
      id: "sharing-results",
      title: "Sharing Your Try-On Results",
      icon: <Share2 className="w-6 h-6" />,
      steps: [
        {
          number: 1,
          title: "View Your Try-On",
          description: "See the AI-generated preview of how the garment looks on you.",
        },
        {
          number: 2,
          title: "Download Image",
          description: "Save the try-on image to your device for later reference.",
        },
        {
          number: 3,
          title: "Share on Social Media",
          description: "Post your try-on results on Instagram, TikTok, or other social platforms.",
        },
        {
          number: 4,
          title: "Tag the Boutique",
          description: "Tag the boutique in your post to help them reach more customers.",
        },
        {
          number: 5,
          title: "Earn Referral Rewards",
          description: "Share your referral link to earn credits when friends make purchases.",
        },
      ],
    },
  ];

  const faqs = [
    {
      question: "How accurate are the virtual try-ons?",
      answer: "Our AI technology provides realistic previews, but results may vary based on photo quality and body shape. Always check the boutique's return policy before purchasing.",
    },
    {
      question: "Do I need to buy credits to try on?",
      answer: "Some boutiques offer free try-ons, while others charge a small fee. Check the boutique's pricing before trying on.",
    },
    {
      question: "What if the try-on doesn't look right?",
      answer: "If you're not satisfied with the result, you can try again with a different photo. If there's an error, your credits will be refunded.",
    },
    {
      question: "Can I try on multiple items?",
      answer: "Yes! You can try on as many items as you want. Each try-on may use credits depending on the boutique's pricing.",
    },
    {
      question: "Is my photo stored or shared?",
      answer: "Your photos are processed securely and are not stored or shared. We respect your privacy completely.",
    },
    {
      question: "What if I have a different body type?",
      answer: "StyleSwap works with all body types. The key is taking a clear, full-body photo in fitted clothes for best results.",
    },
    {
      question: "Can I use photos from different angles?",
      answer: "Front-facing photos work best. Side or back angles may produce less accurate results.",
    },
    {
      question: "How do I get more credits?",
      answer: "You can purchase credit packages from the pricing page, or earn free credits through referrals.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-secondary text-secondary-foreground py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How to Use Virtual Try-On</h1>
          <p className="text-lg text-secondary-foreground/90">
            Master the art of virtual try-on and find your perfect fit
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Disclaimer */}
        <Card className="mb-8 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardContent className="pt-6 flex gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                AI-Generated Try-On Disclaimer
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Virtual try-on images are AI-generated and may appear slightly disoriented or unrealistic in some cases. 
                Always review the boutique's return policy and product details before making a purchase.
              </p>
            </div>
          </CardContent>
        </Card>

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
                    <div className="text-secondary">{tutorial.icon}</div>
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
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-secondary-foreground font-bold text-sm">
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
        <div className="bg-gradient-to-r from-secondary/10 to-primary/10 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Try On?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Start exploring virtual try-ons from your favorite boutiques and find your perfect fit.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              Browse Boutiques
            </Button>
            <Button variant="outline">Get Credits</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
