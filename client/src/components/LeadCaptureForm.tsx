import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

export function LeadCaptureForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [boutiqueName, setBoutiqueName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name || !boutiqueName) {
      setStatus('error');
      setMessage('Please fill in all fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setStatus('idle');

    try {
      // Store lead in database via API
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          boutiqueName,
          source: 'boutique-features-page',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Thank you! We\'ll be in touch soon.');
        setEmail('');
        setName('');
        setBoutiqueName('');
      } else {
        setStatus('error');
        setMessage('Failed to submit. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
      console.error('Lead submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg border border-border shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Get in Touch</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Interested in StyleSwap? Enter your details and we'll contact you with pricing and demo options.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Your Name</label>
          <Input
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Boutique Name</label>
          <Input
            type="text"
            placeholder="Your Boutique"
            value={boutiqueName}
            onChange={(e) => setBoutiqueName(e.target.value)}
            disabled={isLoading}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email Address</label>
          <Input
            type="email"
            placeholder="you@boutique.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="w-full"
          />
        </div>

        {status === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? 'Sending...' : 'Send Inquiry'}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground text-center mt-3">
        We respect your privacy. No spam, guaranteed.
      </p>
    </div>
  );
}
