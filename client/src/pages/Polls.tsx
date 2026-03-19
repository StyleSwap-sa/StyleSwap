import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PollCreationForm } from "@/components/PollCreationForm";
import { TrendingPollsFeed } from "@/components/TrendingPollsFeed";
import { useAuth } from "@/_core/hooks/useAuth";
import { Plus } from "lucide-react";

export default function Polls() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("trending");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Outfit Polls</h1>
          <p className="text-muted-foreground">
            Vote on trending outfit styles and share your favorites with friends
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="trending">Trending</TabsTrigger>
            {user && <TabsTrigger value="create">Create Poll</TabsTrigger>}
          </TabsList>

          {/* Trending Polls */}
          <TabsContent value="trending" className="mt-8">
            <div className="max-w-4xl mx-auto">
              <TrendingPollsFeed />
            </div>
          </TabsContent>

          {/* Create Poll */}
          {user && (
            <TabsContent value="create" className="mt-8">
              <div className="max-w-2xl mx-auto">
                <PollCreationForm />
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Login Prompt */}
        {!user && (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Sign in to create and vote on polls
            </p>
            <Button size="lg">Sign In to Get Started</Button>
          </div>
        )}
      </div>
    </div>
  );
}
