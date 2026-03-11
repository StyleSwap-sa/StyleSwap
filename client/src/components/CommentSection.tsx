import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Heart, Trash2, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface CommentSectionProps {
  outfitId: number;
}

export function CommentSection({ outfitId }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  const { data: commentsData, refetch } = trpc.comments.getComments.useQuery({
    outfitId,
    limit: 10,
  });

  const { data: countData } = trpc.comments.getCommentCount.useQuery({
    outfitId,
  });

  const addCommentMutation = trpc.comments.addComment.useMutation({
    onSuccess: () => {
      setComment("");
      refetch();
    },
  });

  const deleteCommentMutation = trpc.comments.deleteComment.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const likeCommentMutation = trpc.comments.likeComment.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleAddComment = () => {
    if (!comment.trim() || !isAuthenticated) return;

    addCommentMutation.mutate({
      outfitId,
      comment: comment.trim(),
    });
  };

  return (
    <div className="space-y-3">
      {/* Comment Count & Toggle */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        <span>{countData?.count || 0} Comments</span>
      </button>

      {showComments && (
        <div className="space-y-3 border-t pt-3">
          {/* Add Comment Form */}
          {isAuthenticated ? (
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleAddComment();
                }}
                className="text-sm"
              />
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!comment.trim() || addCommentMutation.isPending}
              >
                Post
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Please log in to comment
            </p>
          )}

          {/* Comments List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {commentsData?.comments && commentsData.comments.length > 0 ? (
              commentsData.comments.map((comment) => (
                <Card key={comment.id} className="p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">
                        {comment.userName || "Anonymous"}
                      </p>
                      <p className="text-sm text-foreground mt-1">
                        {comment.comment}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          likeCommentMutation.mutate({
                            commentId: comment.id,
                          })
                        }
                        className="p-1 hover:bg-accent rounded transition-colors"
                        title="Like comment"
                      >
                        <Heart className="w-3 h-3" />
                        {comment.likes > 0 && (
                          <span className="text-xs ml-1">{comment.likes}</span>
                        )}
                      </button>

                      {user?.id === comment.userId && (
                        <button
                          onClick={() =>
                            deleteCommentMutation.mutate({
                              commentId: comment.id,
                            })
                          }
                          className="p-1 hover:bg-destructive/10 rounded transition-colors"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
