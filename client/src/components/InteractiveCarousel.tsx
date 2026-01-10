import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface CarouselSlide {
  id: number;
  image: string;
  title: string;
  description: string;
}

export function InteractiveCarousel() {
  const slides: CarouselSlide[] = [
    {
      id: 1,
      image: '/images/carousel-tryon-1.jpg',
      title: 'Professional Look',
      description: 'Transform casual wear into professional business attire instantly',
    },
    {
      id: 2,
      image: '/images/carousel-tryon-2.jpg',
      title: 'Evening Elegance',
      description: 'See how formal wear looks before making the purchase',
    },
    {
      id: 3,
      image: '/images/carousel-tryon-3.jpg',
      title: 'Summer Style',
      description: 'Discover seasonal trends and see them on your body type',
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setAutoPlay(false);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setAutoPlay(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setAutoPlay(false);
  };

  const slide = slides[currentSlide];

  return (
    <section className="py-20 container mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-5xl md:text-6xl font-bold mb-6">INTERACTIVE DEMO</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Explore how StyleSwap transforms different outfits. Swipe through real-world examples of virtual try-ons in action.
        </p>
      </div>

      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black">
        {/* Main Carousel Image */}
        <div className="relative h-[500px] md:h-[600px] overflow-hidden bg-muted">
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover transition-opacity duration-500"
          />

          {/* Play Icon Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm border-2 border-primary mb-6">
                <Play className="w-8 h-8 text-primary fill-primary" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">
                {slide.title}
              </h3>
              <p className="text-lg text-gray-100 max-w-xl mx-auto">
                {slide.description}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none">
          <Button
            onClick={prevSlide}
            className="pointer-events-auto w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white border-0 backdrop-blur-sm transition-all"
            size="icon"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            onClick={nextSlide}
            className="pointer-events-auto w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white border-0 backdrop-blur-sm transition-all"
            size="icon"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-primary w-8'
                  : 'bg-white/40 w-2 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Carousel Info Cards */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        {slides.map((item, index) => (
          <button
            key={item.id}
            onClick={() => goToSlide(index)}
            className={`p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-left ${
              index === currentSlide
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border hover:border-primary/50 bg-card'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                index === currentSlide ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <span className="font-bold text-lg">{index + 1}</span>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-16 text-center">
        <p className="text-muted-foreground mb-6 text-lg">
          Ready to try StyleSwap for yourself?
        </p>
        <Button className="premium-button bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-bold">
          Start Your Free Trial
        </Button>
      </div>
    </section>
  );
}
