export function getAffiliateSlug(): string | undefined {
  const match = document.cookie.match(/(?:^|;\s*)affiliate_slug=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}