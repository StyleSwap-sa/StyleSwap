import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Plus,
  Trash2,
  Edit2,
  Upload,
  Loader2,
  Search,
  Grid,
  List,
  X,
  Check,
  AlertCircle,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  price?: number;
  size?: string;
  color?: string;
  createdAt: Date;
}

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: string;
  size: string;
  color: string;
  image: File | null;
}

export default function ProductManagement() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    category: "clothing",
    price: "",
    size: "",
    color: "",
    image: null,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch boutiques
  const { data: boutiques } = trpc.boutiques.myBoutiques.useQuery();
  const boutiqueId = boutiques?.[0]?.id;

  // Fetch products
  const { data: products, isLoading, refetch } = trpc.products.getByBoutique.useQuery(
    { boutiqueId: boutiqueId || 0, activeOnly: false },
    { enabled: !!boutiqueId }
  );
  // Create/Update product mutations
  const createProductMutation = trpc.products.create.useMutation();
  const updateProductMutation = trpc.products.update.useMutation();
  const deleteProductMutation = trpc.products.deactivate.useMutation();

  const categories = ["clothing", "accessories", "footwear", "outerwear", "activewear"];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }
      setFormData((prev) => ({ ...prev, image: file }));
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boutiqueId) {
      setError("No boutique selected");
      return;
    }

    if (!formData.name.trim()) {
      setError("Product name is required");
      return;
    }

    try {
      setError("");
      setSuccess("");

      // For now, create product without image (image upload will be phase 6)
      if (editingProduct) {
        await updateProductMutation.mutateAsync({
          id: editingProduct.id,
          boutiqueId,
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          price: formData.price ? parseFloat(formData.price) : undefined,
        });
        setSuccess("Product updated successfully!");
      } else {
        await createProductMutation.mutateAsync({
          boutiqueId,
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          imageUrl: "https://via.placeholder.com/400x400?text=" + encodeURIComponent(formData.name),
          price: formData.price ? parseFloat(formData.price) : undefined,
        });
        setSuccess("Product created successfully!");
      }

      // Reset form
      setFormData({
        name: "",
        description: "",
        category: "clothing",
        price: "",
        size: "",
        color: "",
        image: null,
      });
      setEditingProduct(null);
      setShowUploadForm(false);

      // Refetch products
      await refetch();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save product");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      category: product.category || "clothing",
      price: product.price?.toString() || "",
      size: product.size || "",
      color: product.color || "",
      image: null,
    });
    setShowUploadForm(true);
  };

  const handleDelete = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await deleteProductMutation.mutateAsync({ id: productId, boutiqueId: boutiqueId || 0 });
      setSuccess("Product deleted successfully!");
      await refetch();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete product");
    }
  };

  const handleCancel = () => {
    setShowUploadForm(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      category: "clothing",
      price: "",
      size: "",
      color: "",
      image: null,
    });
    setError("");
  };

  // Filter products
  const filteredProducts = (products || []).filter((product: any) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold">Product Catalogue</h1>
            <p className="text-muted-foreground mt-2">
              Manage your clothing inventory and products
            </p>
          </div>
          <Button
            onClick={() => setShowUploadForm(true)}
            className="gap-2"
            disabled={showUploadForm}
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Upload Form */}
        {showUploadForm && (
          <Card className="premium-card border-primary/30">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Product Name */}
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Black Denim Jacket"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-2"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <Label htmlFor="price">Price (R)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      placeholder="299.99"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="mt-2"
                      step="0.01"
                    />
                  </div>

                  {/* Size */}
                  <div>
                    <Label htmlFor="size">Size</Label>
                    <Input
                      id="size"
                      name="size"
                      placeholder="e.g., M, L, XL"
                      value={formData.size}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      name="color"
                      placeholder="e.g., Black, Blue, Red"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Product details, materials, care instructions..."
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-2"
                    rows={4}
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <Label htmlFor="image">Product Image</Label>
                  <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop your image here, or click to select
                    </p>
                    <input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("image")?.click()
                      }
                    >
                      Select Image
                    </Button>
                    {formData.image && (
                      <p className="text-xs text-green-600 mt-2">
                        ✓ {formData.image.name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Max 5MB. Supported: JPG, PNG, WebP
                    </p>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    disabled={
                      createProductMutation.isPending ||
                      updateProductMutation.isPending
                    }
                  >
                    {createProductMutation.isPending ||
                    updateProductMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {editingProduct ? "Update Product" : "Create Product"}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancel}
                    disabled={
                      createProductMutation.isPending ||
                      updateProductMutation.isPending
                    }
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters & View Controls */}
        {!showUploadForm && (
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 flex gap-4 items-center">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Products Display */}
        {!showUploadForm && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="premium-card">
                <CardContent className="pt-12 text-center space-y-6">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <Plus className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">No Products Yet</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {searchQuery || selectedCategory !== "all"
                        ? "No products match your search or filter"
                        : "Start by adding your first product to your catalogue"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product: any) => (
                  <Card key={product.id} className="premium-card overflow-hidden">
                    {product.imageUrl && (
                      <div className="w-full h-48 bg-muted overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <h3 className="font-bold text-lg line-clamp-2">
                          {product.name}
                        </h3>
                        {product.category && (
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            {product.category}
                          </p>
                        )}
                      </div>

                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      <div className="flex gap-2 text-sm">
                        {product.size && (
                          <span className="bg-muted px-2 py-1 rounded text-xs">
                            {product.size}
                          </span>
                        )}
                        {product.color && (
                          <span className="bg-muted px-2 py-1 rounded text-xs">
                            {product.color}
                          </span>
                        )}
                      </div>

                      {product.price && (
                        <div className="text-lg font-bold">
                          R{product.price.toFixed(2)}
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={() => handleEdit(product)}
                          disabled={
                            updateProductMutation.isPending ||
                            deleteProductMutation.isPending
                          }
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2 text-red-600 hover:text-red-600"
                          onClick={() => handleDelete(product.id)}
                          disabled={
                            updateProductMutation.isPending ||
                            deleteProductMutation.isPending
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product: any) => (
                  <Card key={product.id} className="premium-card">
                    <CardContent className="py-4 px-6 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {product.category && `${product.category} • `}
                          {product.price && `R${product.price.toFixed(2)}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product)}
                          disabled={
                            updateProductMutation.isPending ||
                            deleteProductMutation.isPending
                          }
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-600"
                          onClick={() => handleDelete(product.id)}
                          disabled={
                            updateProductMutation.isPending ||
                            deleteProductMutation.isPending
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Product Count */}
            {filteredProducts.length > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                Showing {filteredProducts.length} of {products?.length || 0}{" "}
                products
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
