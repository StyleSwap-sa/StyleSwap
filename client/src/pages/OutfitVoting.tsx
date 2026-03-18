import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Heart, Share2, Loader2, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function OutfitVoting() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    outfitAImageUrl: "",
    outfitBImageUrl: "",
    outfitCImageUrl: "",
    outfitATitle: "Outfit A",
    outfitBTitle: "Outfit B",
    outfitCTitle: "Outfit C",
  });

  const { data: userPolls, isLoading: pollsLoading } =
    trpc.voting.getUserVotingPolls.useQuery();

  const createPollMutation = trpc.voting.createVotingPoll.useMutation({
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Voting poll created successfully",
      });
      setShowCreateDialog(false);
      setFormData({
        title: "",
        description: "",
        outfitAImageUrl: "",
        outfitBImageUrl: "",
        outfitCImageUrl: "",
        outfitATitle: "Outfit A",
        outfitBTitle: "Outfit B",
        outfitCTitle: "Outfit C",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreatePoll = () => {
    if (
      !formData.title ||
      !formData.outfitAImageUrl ||
      !formData.outfitBImageUrl
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createPollMutation.mutate({
      title: formData.title,
      description: formData.description,
      outfitAImageUrl: formData.outfitAImageUrl,
      outfitBImageUrl: formData.outfitBImageUrl,
      outfitCImageUrl: formData.outfitCImageUrl || undefined,
      outfitATitle: formData.outfitATitle,
      outfitBTitle: formData.outfitBTitle,
      outfitCTitle: formData.outfitCTitle,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pick My Outfit</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          Create New Poll
        </Button>
      </div>

      {pollsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin w-8 h-8" />
        </div>
      ) : userPolls && userPolls.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userPolls.map((poll) => (
            <VotingPollCard key={poll.id} poll={poll} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No voting polls yet. Create one to let friends vote on your outfits!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create Poll Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Voting Poll</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Poll Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Which outfit should I wear to the party?"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add context or details about the outfits..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="outfitATitle">Outfit A Title</Label>
                <Input
                  id="outfitATitle"
                  value={formData.outfitATitle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      outfitATitle: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="outfitAImageUrl">Outfit A Image URL *</Label>
                <Input
                  id="outfitAImageUrl"
                  placeholder="https://..."
                  value={formData.outfitAImageUrl}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      outfitAImageUrl: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="outfitBTitle">Outfit B Title</Label>
                <Input
                  id="outfitBTitle"
                  value={formData.outfitBTitle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      outfitBTitle: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="outfitBImageUrl">Outfit B Image URL *</Label>
                <Input
                  id="outfitBImageUrl"
                  placeholder="https://..."
                  value={formData.outfitBImageUrl}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      outfitBImageUrl: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="outfitCTitle">Outfit C Title (Optional)</Label>
                <Input
                  id="outfitCTitle"
                  value={formData.outfitCTitle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      outfitCTitle: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="outfitCImageUrl">Outfit C Image URL (Optional)</Label>
                <Input
                  id="outfitCImageUrl"
                  placeholder="https://..."
                  value={formData.outfitCImageUrl}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      outfitCImageUrl: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePoll}
              disabled={createPollMutation.isPending}
            >
              {createPollMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Poll"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VotingPollCard({
  poll,
}: {
  poll: {
    id: number;
    title: string;
    totalVotes: number | null;
    isActive: boolean;
  };
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{poll.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant={poll.isActive ? "default" : "secondary"}>
            {poll.isActive ? "Active" : "Closed"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {poll.totalVotes || 0} votes
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            View Results
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
