import { VirtualTryOnUpload } from "@/components/VirtualTryOnUpload";

/**
 * Unified Try-On Page
 *
 * VirtualTryOnUpload is the single try-on entry point. It contains the
 * standard AI upload flow and exposes AR Try-On as an alternative.
 */
export default function TryOnPage() {
  return <VirtualTryOnUpload />;
}
