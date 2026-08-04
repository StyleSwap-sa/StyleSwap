import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Hook to fetch and cache presigned URLs for avatar keys
 * Usage: const avatarUrl = useAvatarUrl(profile?.avatar)
 */
export function useAvatarUrl(avatarKey: string | null | undefined): string | null {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!avatarKey) {
      setPresignedUrl(null);
      return;
    }

    // Don't fetch if it's already a presigned URL
    if (avatarKey.includes("?X-Amz-")) {
      setPresignedUrl(avatarKey);
      return;
    }

    const generatePresignedUrl = async () => {
      try {
        setIsLoading(true);
        // Call a tRPC procedure to generate presigned URL
        // For now, we'll use a direct approach
        
        // If it's just a key (like "avatars/user-123-timestamp.jpg")
        // We can construct a presigned URL or fetch via API
        
        // Option 1: If you create a tRPC endpoint for this
        // const { data } = await trpc.profiles.getAvatarPresignedUrl.useQuery({ key: avatarKey });
        // setPresignedUrl(data?.url || null);
        
        // Option 2: Direct presigned URL generation (if exposed)
        const response = await fetch(`/api/presigned-url?key=${encodeURIComponent(avatarKey)}`);
        if (response.ok) {
          const data = await response.json();
          setPresignedUrl(data.url);
        } else {
          // Fallback: return the key as-is (might not work but won't break)
          setPresignedUrl(avatarKey);
        }
      } catch (error) {
        console.error("[useAvatarUrl] Failed to fetch presigned URL:", error);
        setPresignedUrl(avatarKey); // Fallback
      } finally {
        setIsLoading(false);
      }
    };

    generatePresignedUrl();
  }, [avatarKey]);

  return presignedUrl;
}