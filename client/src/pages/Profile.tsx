import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, MapPin, Heart, History, Settings, LogOut, Edit2, Save, X, Loader2, Upload, Camera } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

import { useAvatarUrl } from "@/hooks/useAvatarUrl";


export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"account" | "favorites" | "history">("account");
  const [editData, setEditData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  // 🔥 Avatar upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);

  // Fetch user's stats from database
  const { data: userStats, isLoading: statsLoading } = trpc.profiles.getUserStats.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user }
  );

  // Fetch user's favorites (liked outfits)
  const { data: likedOutfits, isLoading: favoritesLoading } = trpc.profiles.getLikedOutfits.useQuery(
    { userId: user?.id || 0, limit: 10 },
    { enabled: !!user }
  );

  // Fetch user's purchase history
  const { data: purchaseHistory, isLoading: historyLoading } = trpc.profiles.getPurchaseHistory.useQuery(
    { userId: user?.id || 0, limit: 10 },
    { enabled: !!user }
  );

  // 🔥 ADD THIS: Fetch current user's profile to get stored avatar
  const { data: userProfile } = trpc.profiles.getCurrentProfile.useQuery();
  // Support both possible avatar field names from different profile shapes
  // Safely handle different profile shapes that may have either `avatar` or `profileImage`
  const avatarKey = userProfile
    ? 'avatar' in userProfile
      ? (userProfile.avatar as string | null)
      : (userProfile as any)?.profileImage ?? null
    : null;
  const storedAvatarPresignedUrl = useAvatarUrl(avatarKey);

  // 🔥 Avatar upload mutation
  // trpc utils for cache invalidation
  const utils = trpc.useContext();

  const uploadAvatarMutation = trpc.profiles.uploadAvatar.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Avatar updated successfully!");
      setAvatarPreview(null);
      setCurrentAvatarUrl(data.avatarUrl);
      
      // 🔥 ADD THIS: Invalidate and refetch current profile
      utils.profiles.getCurrentProfile.invalidate();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsUploadingAvatar(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload avatar");
      setIsUploadingAvatar(false);
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-sm md:text-base text-muted-foreground mb-4">Please log in to view your profile</p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 🔥 Handle avatar file selection
  const handleAvatarFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and GIF images are allowed");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAvatarPreview(result);
    };
    reader.readAsDataURL(file);
  };

  // 🔥 Handle avatar upload
  const handleAvatarUpload = async () => {
    if (!avatarPreview) return;

    setIsUploadingAvatar(true);
    uploadAvatarMutation.mutate({
      base64Data: avatarPreview,
      fileName: fileInputRef.current?.files?.[0]?.name || "avatar.jpg",
      contentType: fileInputRef.current?.files?.[0]?.type || "image/jpeg",
    });
  };

  // 🔥 Handle avatar upload cancel
  const handleAvatarCancel = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = () => {
    toast.success("Profile updated successfully!");
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-6 md:py-12">
      <div className="container mx-auto max-w-6xl px-4 md:px-0">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">My Profile</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your account, favorites, and purchase history</p>
        </div>

        {/* Profile Card */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
          <Card className="premium-card rounded-2xl md:col-span-1">
            <CardHeader>
              <div className="flex flex-col items-center gap-4 mb-4">
                {/* 🔥 Avatar Section */}
                <div className="relative">
                  {avatarPreview ? (
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
                          <img
                            src={avatarPreview}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : storedAvatarPresignedUrl ? (  // 🔥 FIXED: Shows persisted avatar
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
                          <img
                            src={storedAvatarPresignedUrl}
                            alt="Current avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : currentAvatarUrl ? (  // Keep this as fallback
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
                          <img
                            src={currentAvatarUrl}
                            alt="Current avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-4 border-primary/20">
                          <User className="w-10 h-10 md:w-12 md:h-12 text-white" />
                        </div>
                      )}
                  {/* Upload button */}
                  {!avatarPreview && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition-colors shadow-lg"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarFileSelect}
                  className="hidden"
                />

                {/* Avatar Upload Controls */}
                {avatarPreview ? (
                  <div className="flex flex-col gap-2 w-full">
                    <Button
                      onClick={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                      className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm"
                    >
                      {isUploadingAvatar ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Photo
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleAvatarCancel}
                      variant="outline"
                      disabled={isUploadingAvatar}
                      className="w-full gap-2 h-9 text-sm"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full gap-2 h-9 text-sm"
                  >
                    <Camera className="w-4 h-4" />
                    Change Photo
                  </Button>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  JPG, PNG, WebP or GIF • Max 5MB
                </p>
              </div>

              <CardTitle className="text-xl sm:text-2xl text-center">{user.name || "User"}</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground text-center truncate">{user.email}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs md:text-sm font-medium mb-2 block">Name</label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs md:text-sm font-medium mb-2 block">Email</label>
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="flex flex-col xs:flex-row gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9"
                    >
                      <Save className="w-4 h-4" />
                      <span className="hidden xs:inline">Save</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 gap-2 h-9"
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden xs:inline">Cancel</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs md:text-sm">
                    <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs md:text-sm">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">Johannesburg, South Africa</span>
                  </div>
                  <div className="pt-4 border-t border-border/20">
                    <p className="text-xs text-muted-foreground mb-2">Member since</p>
                    <p className="font-medium text-sm">January 2026</p>
                  </div>
                </div>
              )}
              {(user?.role === 'admin' || user?.userType === 'admin') && (
                <Button
                  onClick={() => setLocation('/admin/dashboard')}
                  className="w-full gap-2 bg-primary/20 text-primary hover:bg-primary/30 mb-3 h-9 text-sm"
                >
                  Platform Analytics
                </Button>
              )}
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full gap-2 mt-6 h-9 text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="md:col-span-2 space-y-3 md:space-y-4">
            <Card className="premium-card rounded-2xl">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-base md:text-lg">Account Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <div className="p-3 md:p-4 bg-primary/10 rounded-lg">
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Try-Ons</p>
                    <p className="text-2xl md:text-3xl font-bold text-primary">
                      {statsLoading ? "..." : userStats?.totalTryOns || 0}
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-secondary/10 rounded-lg">
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Remaining Credits</p>
                    <p className="text-2xl md:text-3xl font-bold text-secondary">
                      {statsLoading ? "..." : userStats?.remainingCredits || 0}
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-accent/10 rounded-lg">
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Spent</p>
                    <p className="text-2xl md:text-3xl font-bold">
                      R{statsLoading ? "..." : (userStats?.totalSpent || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-foreground/5 rounded-lg">
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Favorites</p>
                    <p className="text-2xl md:text-3xl font-bold">
                      {favoritesLoading ? "..." : likedOutfits?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/*<Card className="premium-card rounded-2xl">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-base md:text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <Button variant="outline" className="gap-2 h-9 text-xs md:text-sm" onClick={() => setLocation('/settings')}>
                    <Settings className="w-4 h-4" />
                    <span className="hidden xs:inline">Settings</span>
                  </Button>
                  <Button variant="outline" className="gap-2 h-9 text-xs md:text-sm" onClick={() => setLocation('/notifications')}>
                    <Mail className="w-4 h-4" />
                    <span className="hidden xs:inline">Notifications</span>
                  </Button>
                </div>
              </CardContent>
            </Card> */}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border/20 mb-6 md:mb-8 overflow-x-auto">
          <div className="flex gap-2 md:gap-8 min-w-max md:min-w-0">
            <button
              onClick={() => setActiveTab("account")}
              className={`pb-4 px-2 md:px-0 font-medium text-xs md:text-base whitespace-nowrap transition-colors ${
                activeTab === "account"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
              <span className="hidden xs:inline">Settings</span>
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`pb-4 px-2 md:px-0 font-medium text-xs md:text-base whitespace-nowrap transition-colors ${
                activeTab === "favorites"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
              <span className="hidden xs:inline">Favorites</span> ({likedOutfits?.length || 0})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "account" && (
          <div className="grid md:grid-cols-2 gap-4 md:gap-8">
            <Card className="premium-card rounded-2xl">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-base md:text-lg">Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs md:text-sm font-medium mb-2 block">Email Notifications</label>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-xs md:text-sm text-muted-foreground">Receive email updates</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium mb-2 block">SMS Notifications</label>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-xs md:text-sm text-muted-foreground">Receive SMS alerts</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card rounded-2xl">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-base md:text-lg">Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full h-9 text-xs md:text-sm">
                  Change Password
                </Button>
                <Button variant="outline" className="w-full h-9 text-xs md:text-sm">
                  Two-Factor Authentication
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "favorites" && (
          <Card className="premium-card rounded-2xl">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-base md:text-lg">Your Liked Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {favoritesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : likedOutfits?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No liked posts yet</p>
                  <p className="text-sm">Like some outfits on the Global Feed!</p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {likedOutfits?.map((outfit: any) => (
                    <div key={outfit.id} className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 p-3 md:p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm md:text-base truncate">{outfit.title}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">{outfit.style || "Outfit"}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(outfit.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}