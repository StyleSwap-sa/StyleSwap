import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function AffiliateReferralLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const track = trpc.affiliate.trackClick.useMutation();

  useEffect(() => {
    if (!slug) return;
    // Fire-and-forget: record the click, then redirect to sign-up.
    track
      .mutateAsync({
        slug,
        userAgent: navigator.userAgent,
      })
      .catch(() => {
        /* swallow — click tracking is best-effort */
      })
      .finally(() => {
        // Persist the slug so the checkout page (and any future signup page)
        // can forward it. 90-day cookie lifetime matches the attribution window.
        document.cookie = `affiliate_slug=${slug}; max-age=${90 * 24 * 60 * 60}; path=/; samesite=lax`;
        // Redirect to the home page where the Sign Up modal lives.
        setLocation("/");
      });
  }, [slug]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}