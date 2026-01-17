import { ContactForm } from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="py-20 container mx-auto">
        <h2 className="text-5xl md:text-6xl font-bold mb-16 text-center">GET IN TOUCH</h2>
        <ContactForm />
      </section>
    </div>
  );
}
