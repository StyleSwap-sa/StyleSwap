import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function BodyModels() {
  const models = [
    {
      id: 1,
      name: "South African Woman - Light Skin",
      description: "Professional model with warm, sun-kissed complexion and honey blonde hair",
      imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663284718291/SsHmOpCRJXTiQCwe.jpg",
      downloadName: "body-model-south-african-woman.jpg",
    },
    {
      id: 2,
      name: "South African Woman - Plus Size",
      description: "Professional plus-size model with beautiful dark skin tone and braided hair",
      imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663284718291/jUcOGczAQSkqqvzl.jpg",
      downloadName: "body-model-plus-size-african-woman.jpg",
    },
  ];

  const handleDownload = (imageUrl: string, fileName: string) => {
    // Create a link element
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = fileName;
    link.target = "_blank";
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border/20 sticky top-0 z-40 bg-background/95 backdrop-blur-md">
        <div className="container mx-auto py-4 flex items-center justify-between">
          <Link href="/customer-try-on">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Try-On</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold">Body Models</h1>
          <div className="w-20" />
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-bold mb-4">Professional Body Models</h2>
            <p className="text-lg text-muted-foreground">
              Download these professional body models to use as references for virtual try-ons. 
              Each model is optimized for fashion e-commerce and try-on applications.
            </p>
          </div>

          {/* Models Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {models.map((model) => (
              <Card key={model.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={model.imageUrl}
                    alt={model.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{model.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{model.description}</p>
                  <Button
                    onClick={() => handleDownload(model.imageUrl, model.downloadName)}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download to Gallery
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info Section */}
          <div className="mt-12 p-6 bg-secondary/10 border border-secondary/20 rounded-lg">
            <h3 className="text-xl font-bold mb-3">How to Use These Models</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>✓ Download the model image to your device</li>
              <li>✓ Upload it as your body photo in the virtual try-on feature</li>
              <li>✓ Upload a clothing image to see how it looks on the model</li>
              <li>✓ Perfect for testing and demonstrating the try-on feature</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
