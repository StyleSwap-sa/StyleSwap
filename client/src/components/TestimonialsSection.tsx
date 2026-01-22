import { Star, TrendingUp } from 'lucide-react';

interface Testimonial {
  name: string;
  boutique: string;
  location: string;
  quote: string;
  metrics: string;
  image: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: 'Thandi Mkhize',
    boutique: 'Luxury Threads Co.',
    location: 'Johannesburg',
    quote: 'StyleSwap transformed our online presence. We saw a 45% increase in conversions within the first month. Our customers love being able to see how clothes fit before buying.',
    metrics: '+45% Conversions | -38% Returns',
    image: '👗',
    rating: 5,
  },
  {
    name: 'Amara Okonkwo',
    boutique: 'Urban Fashion Hub',
    location: 'Cape Town',
    quote: 'The virtual try-on feature is a game-changer. We reduced our photography costs by 80% and can now showcase our entire collection without expensive photoshoots.',
    metrics: '80% Cost Savings | 500+ Products',
    image: '✨',
    rating: 5,
  },
  {
    name: 'Zainab Hassan',
    boutique: 'Elegant Styles Boutique',
    location: 'Durban',
    quote: 'Our customers are more confident in their purchases now. The try-on feature has become our biggest selling point, and we\'ve seen repeat customers increase by 60%.',
    metrics: '+60% Repeat Customers | 3.2x ROI',
    image: '💎',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Success Stories</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join 50+ boutiques already transforming their business with StyleSwap
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground mb-4 leading-relaxed italic">
                "{testimonial.quote}"
              </p>

              {/* Metrics */}
              <div className="flex items-center gap-2 mb-4 p-3 bg-primary/5 rounded-lg">
                <TrendingUp className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-primary">{testimonial.metrics}</p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="text-3xl">{testimonial.image}</div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.boutique}, {testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 grid md:grid-cols-4 gap-6 text-center">
          <div className="p-4">
            <p className="text-3xl font-bold text-primary">50+</p>
            <p className="text-sm text-muted-foreground">Active Boutiques</p>
          </div>
          <div className="p-4">
            <p className="text-3xl font-bold text-primary">+45%</p>
            <p className="text-sm text-muted-foreground">Avg. Conversion Lift</p>
          </div>
          <div className="p-4">
            <p className="text-3xl font-bold text-primary">-38%</p>
            <p className="text-sm text-muted-foreground">Avg. Return Reduction</p>
          </div>
          <div className="p-4">
            <p className="text-3xl font-bold text-primary">4.9/5</p>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
}
