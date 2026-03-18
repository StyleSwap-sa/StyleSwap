import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Users, Zap, Heart } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center">
            About StyleSwap
          </h1>
          <p className="text-2xl md:text-3xl font-bold text-center mb-6 text-primary">
            Try On Outfits. Ask Your Friends. Decide With Confidence.
          </p>
          <p className="text-xl text-muted-foreground text-center leading-relaxed max-w-2xl mx-auto">
            StyleSwap is a social fashion platform that helps people make confident outfit decisions before they buy or wear something.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl space-y-12">
          {/* What We Do */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">What We Do</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Choosing the right outfit can be difficult when shopping online or preparing for an event. StyleSwap solves this problem by combining virtual try-on technology with social interaction, allowing users to see how outfits look on them and get instant feedback from friends and the community.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              With StyleSwap, users can virtually try on clothes, compare different outfits, create polls, and ask friends which look they prefer. This makes fashion decisions more fun, interactive, and confident.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The platform also helps fashion retailers and boutiques reduce uncertainty for shoppers by allowing customers to visualize outfits before purchasing, which can help improve buying confidence and reduce returns.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              StyleSwap is designed to bring together fashion, technology, and community, creating a space where people can discover styles, share opinions, and make better fashion choices together.
            </p>
          </div>

          {/* Mission */}
          <div className="space-y-6 py-8 border-y border-border">
            <h2 className="text-3xl font-bold">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Our mission is to make fashion decisions easier and more social by combining technology and community feedback.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We want to help people feel confident about what they wear while helping fashion businesses connect better with their customers.
            </p>
          </div>

          {/* What You Can Do */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">What You Can Do on StyleSwap</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Virtually try on outfits",
                "Compare different looks",
                "Ask friends for fashion advice",
                "Create outfit polls and voting",
                "Share outfits with your community",
                "Discover trending styles"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                  <span className="text-lg text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* For Businesses */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                For Fashion Businesses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                StyleSwap also provides tools for fashion retailers and boutiques to showcase their clothing through virtual try-on experiences. This allows customers to visualize outfits before purchasing, improving confidence and reducing return rates.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Businesses can integrate StyleSwap into their websites or create their own product pages on the platform to let customers try on their clothing digitally.
              </p>
            </CardContent>
          </Card>

          {/* Vision */}
          <div className="space-y-6 py-8 border-y border-border">
            <h2 className="text-3xl font-bold">Our Vision</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We believe the future of fashion shopping will be more interactive, social, and personalized.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              StyleSwap aims to become a platform where people don't just shop for clothes, but also share style ideas, get feedback, and make fashion decisions together.
            </p>
          </div>

          {/* Core Values */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Our Core Values</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Users,
                  title: "Community First",
                  description: "We believe in the power of community feedback and social interaction to help people make better decisions."
                },
                {
                  icon: Heart,
                  title: "Confidence & Empowerment",
                  description: "We want to help people feel confident about their fashion choices and express their personal style."
                },
                {
                  icon: Zap,
                  title: "Innovation",
                  description: "We combine cutting-edge technology with fashion to create experiences that are both fun and practical."
                }
              ].map((value, idx) => {
                const Icon = value.icon;
                return (
                  <Card key={idx} className="text-center">
                    <CardHeader>
                      <div className="flex justify-center mb-4">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <CardTitle>{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
