import { ArrowRight, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  image?: string;
  slug: string;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "How Virtual Try-Ons Are Revolutionizing Fashion Retail",
    excerpt: "Discover how AI-powered virtual fitting rooms are transforming the way customers shop online and reducing return rates.",
    author: "Sarah Johnson",
    date: "March 10, 2026",
    category: "Industry Trends",
    slug: "virtual-try-ons-revolutionizing-retail",
  },
  {
    id: "2",
    title: "The Future of Fashion: Social Shopping Meets Technology",
    excerpt: "Explore how social features combined with virtual try-on technology create a new era of collaborative fashion decisions.",
    author: "Michael Chen",
    date: "March 5, 2026",
    category: "Technology",
    slug: "future-fashion-social-shopping",
  },
  {
    id: "3",
    title: "Boutique Success Story: How StyleSwap Increased Conversions by 45%",
    excerpt: "Learn how a boutique in Cape Town used StyleSwap to dramatically improve customer satisfaction and sales.",
    author: "Emma Williams",
    date: "February 28, 2026",
    category: "Case Studies",
    slug: "boutique-success-story",
  },
  {
    id: "4",
    title: "Understanding Return Rates in E-Commerce Fashion",
    excerpt: "A deep dive into why fashion returns are so high and how virtual try-ons can help reduce them.",
    author: "David Martinez",
    date: "February 20, 2026",
    category: "Business Insights",
    slug: "understanding-return-rates",
  },
  {
    id: "5",
    title: "StyleSwap for Small Businesses: Getting Started Guide",
    excerpt: "A comprehensive guide for small fashion retailers on how to implement StyleSwap and maximize ROI.",
    author: "Lisa Anderson",
    date: "February 15, 2026",
    category: "Guides",
    slug: "getting-started-small-business",
  },
  {
    id: "6",
    title: "The Psychology of Virtual Try-Ons: Why Customers Love Them",
    excerpt: "Understand the psychological factors that make virtual try-ons so effective for customer engagement.",
    author: "James Wilson",
    date: "February 10, 2026",
    category: "Psychology",
    slug: "psychology-virtual-try-ons",
  },
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center">
            StyleSwap Blog
          </h1>
          <p className="text-xl text-muted-foreground text-center leading-relaxed max-w-2xl mx-auto">
            Stay updated with the latest insights, trends, and success stories from the world of virtual fashion technology.
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow duration-300 flex flex-col">
                {post.image && (
                  <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-t-lg" />
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>
                  <CardTitle className="text-xl leading-tight">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-muted-foreground mb-6 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="space-y-3 border-t border-border/20 pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{post.date}</span>
                    </div>
                  </div>
                  <Button variant="ghost" className="mt-4 w-full justify-start text-primary hover:text-primary/80">
                    Read More <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-y border-border/20">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-muted-foreground mb-8">
            Subscribe to our newsletter to get the latest insights and updates about virtual fashion technology.
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg border border-border/20 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
