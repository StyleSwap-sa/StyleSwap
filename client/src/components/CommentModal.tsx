import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Send, Edit2, Trash2, X, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  outfitId: number;
  onCommentAdded?: () => void;
}

export function CommentModal({ isOpen, onClose, outfitId, onCommentAdded }: CommentModalProps) {

  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  // Fetch comments
  const { data: comments, isLoading, refetch } = trpc.globalFeed.getComments.useQuery(
    { outfitId },
    { enabled: isOpen }
  );

  // Mutations
  const addCommentMutation = trpc.globalFeed.addComment.useMutation({
  onMutate: async ({ outfitId, comment }) => {
    // Cancel outgoing refetches
    await utils.globalFeed.getComments.cancel({ outfitId });
    
    // Snapshot previous value
    const previousData = utils.globalFeed.getComments.getData({ outfitId });
    
    // Optimistically add the new comment
    utils.globalFeed.getComments.setData(
      { outfitId },
      (old: any) => {
        if (!old) return [];
        // Add the new comment at the beginning (newest first)
        return [
          {
            id: Date.now(), // Temporary ID
            comment: comment,
            createdAt: new Date().toISOString(),
            userId: user?.id,
            userName: user?.name || "You",
            userAvatar: null,
          },
          ...old,
        ];
      }
    );
    
    // Also update the comment count in the feed
    utils.globalFeed.getGlobalFeed.setData(
      { limit: 20, offset: 0 },
      (old: any) => {
        if (!old) return old;
        return {
          ...old,
          outfits: old.outfits.map((outfit: any) =>
            outfit.id === outfitId
              ? { ...outfit, commentCount: Number(outfit.commentCount) + 1 }
              : outfit
          ),
        };
      }
    );
    
    return { previousData };
  },
  onError: (err, input, context) => {
    // Rollback on error
    if (context?.previousData) {
      utils.globalFeed.getComments.setData(
        { outfitId: input.outfitId },
        context.previousData
      );
    }
    toast.error(err.message || "Failed to add comment");
  },
  onSuccess: () => {
    setNewComment("");
    onCommentAdded?.();
    toast.success("Comment added!");
  },
});

  const editCommentMutation = trpc.globalFeed.editComment.useMutation({
    onSuccess: () => {
      refetch();
      setEditingCommentId(null);
      setEditText("");
      toast.success("Comment updated!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to edit comment");
    },
  });

  const deleteCommentMutation = trpc.globalFeed.deleteComment.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Comment deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete comment");
    },
  });

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    if (!user) {
      toast.error("Please login to comment");
      return;
    }
    setIsSubmitting(true);
    addCommentMutation.mutate({
      outfitId,
      comment: newComment.trim(),
    });
    setIsSubmitting(false);
  };

  const handleEditComment = (commentId: number) => {
    if (!editText.trim()) return;
    setIsSubmitting(true);
    editCommentMutation.mutate({
      commentId,
      comment: editText.trim(),
    });
    setIsSubmitting(false);
  };

  const handleDeleteComment = (commentId: number) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    setIsDeleting(commentId);
    deleteCommentMutation.mutate({ commentId });
    setIsDeleting(null);
  };

  const startEditing = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditText(comment.comment);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditText("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Comments</span>
            {comments && <span className="text-sm text-muted-foreground">({comments.length})</span>}
          </DialogTitle>
        </DialogHeader>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : comments?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No comments yet</p>
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            comments?.map((comment: any) => {
              const isOwnComment = user?.id === comment.userId;
              const isEditing = editingCommentId === comment.id;

              return (
                <div key={comment.id} className="flex gap-3 group">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={comment.userAvatar || undefined} />
                    <AvatarFallback className="text-xs">
                      {comment.userName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{comment.userName || "User"}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                      {isOwnComment && !isEditing && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                          <button
                            onClick={() => startEditing(comment)}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <Edit2 className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={isDeleting === comment.id}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditComment(comment.id);
                            if (e.key === "Escape") cancelEditing();
                          }}
                        />
                        <Button size="sm" onClick={() => handleEditComment(comment.id)} disabled={isSubmitting}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground break-words mt-0.5">{comment.comment}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comment Input */}
        {user ? (
          <div className="border-t pt-4 flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              className="flex-1"
              disabled={isSubmitting}
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="border-t pt-4 text-center text-muted-foreground text-sm">
            <p>Sign in to join the conversation</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}