import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, MapPin, Heart, History, Settings, LogOut, Edit2, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"account" | "favorites" | "history">("account");
  const [editData, setEditData] = useState({
    name: user?.name || "",
    email: user?.email || "",
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

  const handleSaveProfile = () => {
    toast.success("Profile updated successfully!");
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  // Mock data for favorites
  const favorites = [
    { id: 1, name: "Black Evening Dress", category: "Dresses", price: "R2,500" },
    { id: 2, name: "Blue Denim Jacket", category: "Jackets", price: "R1,200" },
    { id: 3, name: "White Sneakers", category: "Shoes", price: "R800" },
  ];

  // Mock data for purchase history
  const purchaseHistory = [
    {
      id: 1,
      date: "2026-01-15",
      description: "100 Try-Ons Package",
      amount: "R385",
      status: "Completed",
    },
    {
      id: 2,
      date: "2026-01-10",
      description: "50 Try-Ons Package",
      amount: "R150",
      status: "Completed",
    },
    {
      id: 3,
      date: "2026-01-05",
      description: "200 Try-Ons Package",
      amount: "R750",
      status: "Completed",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground py-6 md:py-12">
      <div className="container mx-auto max-w-6xl px-4 md:px-0">
        {/* Header - Responsive */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">My Profile</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your account, favorites, and purchase history</p>
        </div>

        {/* Profile Card - Responsive */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
          <Card className="premium-card rounded-2xl md:col-span-1">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                  <User className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-2 w-full sm:w-auto h-9"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="hidden xs:inline">Edit</span>
                  </Button>
                )}
              </div>
              <CardTitle className="text-xl sm:text-2xl">{user.name || "User"}</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
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
              {/* Admin Dashboard Link - Only visible to owner */}
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
                    <p className="text-2xl md:text-3xl font-bold text-primary">350</p>
                  </div>
                  <div className="p-3 md:p-4 bg-secondary/10 rounded-lg">
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Remaining Credits</p>
                    <p className="text-2xl md:text-3xl font-bold text-secondary">45</p>
                  </div>
                  <div className="p-3 md:p-4 bg-accent/10 rounded-lg">
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Spent</p>
                    <p className="text-2xl md:text-3xl font-bold">R2,885</p>
                  </div>
                  <div className="p-3 md:p-4 bg-foreground/5 rounded-lg">
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Favorites</p>
                    <p className="text-2xl md:text-3xl font-bold">{favorites.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card rounded-2xl">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-base md:text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <Button variant="outline" className="gap-2 h-9 text-xs md:text-sm">
                    <Settings className="w-4 h-4" />
                    <span className="hidden xs:inline">Settings</span>
                  </Button>
                  <Button variant="outline" className="gap-2 h-9 text-xs md:text-sm">
                    <Mail className="w-4 h-4" />
                    <span className="hidden xs:inline">Notifications</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs - Responsive */}
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
              <span className="hidden xs:inline">Favorites</span> ({favorites.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-4 px-2 md:px-0 font-medium text-xs md:text-base whitespace-nowrap transition-colors ${
                activeTab === "history"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
              <span className="hidden xs:inline">History</span>
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
              <CardTitle className="text-base md:text-lg">Your Favorites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:space-y-4">
                {favorites.map((item) => (
                  <div key={item.id} className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 p-3 md:p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">{item.name}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <p className="font-bold text-primary text-sm md:text-base">{item.price}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "history" && (
          <Card className="premium-card rounded-2xl">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-base md:text-lg">Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:space-y-4">
                {purchaseHistory.map((item) => (
                  <div key={item.id} className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 p-3 md:p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base">{item.description}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">{item.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm md:text-base">{item.amount}</p>
                      <p className="text-xs text-green-600">{item.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
