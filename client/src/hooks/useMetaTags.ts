import { useEffect } from 'react';

interface MetaTags {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

/**
 * Custom hook to update Open Graph meta tags dynamically
 * Useful for social media link previews (WhatsApp, Facebook, Twitter, etc.)
 */
export function useMetaTags(tags: MetaTags) {
  useEffect(() => {
    // Update title
    if (tags.title) {
      document.title = tags.title;
      updateMetaTag('og:title', tags.title);
      updateMetaTag('twitter:title', tags.title);
    }

    // Update description
    if (tags.description) {
      updateMetaTag('description', tags.description);
      updateMetaTag('og:description', tags.description);
      updateMetaTag('twitter:description', tags.description);
    }

    // Update image
    if (tags.image) {
      updateMetaTag('og:image', tags.image);
      updateMetaTag('twitter:image', tags.image);
    }

    // Update URL
    if (tags.url) {
      updateMetaTag('og:url', tags.url);
    }
  }, [tags.title, tags.description, tags.image, tags.url]);
}

/**
 * Helper function to update or create a meta tag
 */
function updateMetaTag(name: string, content: string) {
  let element = document.querySelector(`meta[property="${name}"]`) ||
                document.querySelector(`meta[name="${name}"]`);

  if (!element) {
    element = document.createElement('meta');
    if (name.startsWith('og:') || name === 'twitter:title' || name === 'twitter:description' || name === 'twitter:image') {
      element.setAttribute('property', name);
    } else {
      element.setAttribute('name', name);
    }
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}
