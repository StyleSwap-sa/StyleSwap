// Helper function to handle dress image splitting
export const handleDressImageSplitting = async (
  file: File,
  setClothImage: (file: File) => void,
  setLowerClothImage: (file: File) => void,
  setClothImagePreview: (preview: string) => void,
  setLowerClothImagePreview: (preview: string) => void,
  setClothImageDimensions: (dims: { width: number; height: number }) => void,
  setError: (error: string) => void,
  splitDressImage: (file: File) => Promise<{ topImage: File; bottomImage: File }>,
  getImageDimensions: (source: File | string) => Promise<{ width: number; height: number }>
) => {
  try {
    const { topImage, bottomImage } = await splitDressImage(file);
    setClothImage(topImage);
    setLowerClothImage(bottomImage);
    
    // Create previews for both
    const topReader = new FileReader();
    topReader.onload = (e) => {
      setClothImagePreview(e.target?.result as string);
    };
    topReader.readAsDataURL(topImage);
    
    const bottomReader = new FileReader();
    bottomReader.onload = (e) => {
      setLowerClothImagePreview(e.target?.result as string);
    };
    bottomReader.readAsDataURL(bottomImage);
    
    // Get dimensions
    const topDims = await getImageDimensions(topImage);
    setClothImageDimensions(topDims);
  } catch (error) {
    console.error("[VirtualTryOn] Error splitting dress:", error);
    setError("Failed to split dress image. Please try again.");
  }
};
