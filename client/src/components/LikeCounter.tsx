import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface LikeCounterProps {
  outfitId: number;
  initialLikes: number;
  onLikeChange?: (newCount: number) => void;
}

export function LikeCounter({ outfitId, initialLikes, onLikeChange }: LikeCounterProps) {
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const likeMutation = trpc.discovery.likeOutfit.useMutation({
    onSuccess: (data) => {
      setLikeCount(data.likeCount);
      setIsLiked(data.isLiked);
      onLikeChange?.(data.likeCount);
      
      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    },
  });

  const handleLike = () => {
    likeMutation.mutate({ outfitId });
  };

  // Format like count like TikTok (1K, 1.2K, etc.)
  const formatLikeCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleLike}
        disabled={likeMutation.isPending}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
          isLiked
            ? 'bg-red-100 text-red-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Heart
          className={`w-5 h-5 transition-all ${
            isLiked ? 'fill-current' : ''
          } ${isAnimating ? 'scale-125' : 'scale-100'}`}
          style={{
            animation: isAnimating ? 'heartBeat 0.6s ease-in-out' : 'none',
          }}
        />
        <span className="font-semibold text-sm">
          {formatLikeCount(likeCount)}
        </span>
      </button>

      <style>{`
        @keyframes heartBeat {
          0% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.3);
          }
          50% {
            transform: scale(1.1);
          }
          75% {
            transform: scale(1.4);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
