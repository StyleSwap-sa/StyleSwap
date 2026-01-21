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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please log in to view your profile</p>
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
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account, favorites, and purchase history</p>
        </div>

        {/* Profile Card */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <Card className="premium-card rounded-2xl lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                  <User className="w-8 h-8" />
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                )}
              </div>
              <CardTitle className="text-2xl">{user.name || "User"}</CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name</label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Johannesburg, South Africa</span>
                  </div>
                  <div className="pt-4 border-t border-border/20">
                    <p className="text-xs text-muted-foreground mb-2">Member since</p>
                    <p className="font-medium">January 2026</p>
                  </div>
                </div>
              )}
              {/* Admin Dashboard Link - Only visible to owner */}
              {user?.role === 'admin' && (
                <Button
                  onClick={() => setLocation('/admin')}
                  className="w-full gap-2 bg-primary/20 text-primary hover:bg-primary/30 mb-3"
                >
                  Platform Analytics
                </Button>
              )}
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full gap-2 mt-6"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="premium-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Account Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Try-Ons</p>
                    <p className="text-3xl font-bold text-primary">350</p>
                  </div>
                  <div className="p-4 bg-secondary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Remaining Credits</p>
                    <p className="text-3xl font-bold text-secondary">45</p>
                  </div>
                  <div className="p-4 bg-accent/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                    <p className="text-3xl font-bold">R2,885</p>
                  </div>
                  <div className="p-4 bg-foreground/5 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Favorites</p>
                    <p className="text-3xl font-bold">{favorites.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Mail className="w-4 h-4" />
                    Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border/20 mb-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("account")}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === "account"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Settings
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === "favorites"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className="w-4 h-4 inline mr-2" />
              Favorites ({favorites.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === "history"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="w-4 h-4 inline mr-2" />
              Purchase History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "account" && (
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="premium-card rounded-2xl">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Email Notifications</label>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-muted-foreground">Receive purchase confirmations</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Marketing Emails</label>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-muted-foreground">Receive promotions and updates</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Try-On Notifications</label>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-muted-foreground">Notify when try-ons are ready</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card rounded-2xl">
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Two-Factor Authentication
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Download Your Data
                </Button>
                <Button variant="destructive" className="w-full justify-start">
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "favorites" && (
          <div>
            {favorites.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((item) => (
                  <Card key={item.id} className="premium-card rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Heart className="w-12 h-12 text-primary/50" />
                    </div>
                    <CardContent className="pt-4">
                      <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{item.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold">{item.price}</span>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Heart className="w-4 h-4" />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="premium-card rounded-2xl">
                <CardContent className="py-12 text-center">
                  <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No favorites yet</p>
                  <Button onClick={() => setLocation("/dashboard?tab=catalog")}>
                    Browse Garments
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            {purchaseHistory.map((purchase) => (
              <Card key={purchase.id} className="premium-card rounded-2xl">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{purchase.description}</h3>
                      <p className="text-sm text-muted-foreground">{purchase.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">{purchase.amount}</p>
                      <p className="text-sm text-green-600 font-medium">{purchase.status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
