import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
// import { useToast } from "@/hooks/use-toast";
// import { storagePut } from "@/lib/storage";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

interface BatchUploadComponentProps {
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 50;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function BatchUploadComponent({ onSuccess }: BatchUploadComponentProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createBatchMutation = trpc.batchUploads.createBatchUpload.useMutation({
    onSuccess: () => {
      console.log("Batch created successfully");
      setFiles([]);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Failed to create batch:", error.message);
    },
  });

  const addFilesToBatchMutation = trpc.batchUploads.addFilesToBatch.useMutation({
    onSuccess: () => {
      console.log("Files added to batch successfully");
    },
  });

  const validateFiles = (filesToValidate: File[]): UploadedFile[] => {
    const validated: UploadedFile[] = [];

    if (filesToValidate.length + files.length > MAX_FILES) {
      console.warn(`Too many files. Maximum ${MAX_FILES} files allowed`);
      return [];
    }

    filesToValidate.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        console.warn(`${file.name} is not a supported image format`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        console.warn(`${file.name} exceeds 10MB limit`);
        return;
      }

      validated.push({
        id: Math.random().toString(36),
        name: file.name,
        size: file.size,
        status: "pending",
        progress: 0,
      });
    });

    return validated;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validated = validateFiles(droppedFiles);
    setFiles((prev) => [...prev, ...validated]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validated = validateFiles(selectedFiles);
    setFiles((prev) => [...prev, ...validated]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      console.warn("No files selected");
      return;
    }

    // Create batch first
    const batchResult = await createBatchMutation.mutateAsync({
      name: `Batch ${new Date().toLocaleDateString()}`,
      totalFiles: files.length,
    });

    if (!batchResult.id) {
      console.error("Failed to create batch");
      return;
    }

    // Upload files
    const uploadedFiles: Array<{ url: string; fileName: string }> = [];

    for (const file of files) {
      const fileIndex = files.indexOf(file);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "uploading" } : f
        )
      );

      try {
        const fileInput = fileInputRef.current;
        if (!fileInput?.files) return;

        const actualFile = fileInput.files[fileIndex];
        if (!actualFile) return;

        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, progress: i } : f
            )
          );
        }

        // In a real app, upload to S3 here
        uploadedFiles.push({
          url: URL.createObjectURL(actualFile),
          fileName: file.name,
        });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, status: "success", progress: 100 } : f
          )
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: "error",
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : f
          )
        );
      }
    }

    // Add files to batch
    if (uploadedFiles.length > 0) {
      await addFilesToBatchMutation.mutateAsync({
        batchId: batchResult.id,
        files: uploadedFiles.map((f) => ({
          url: f.url,
          fileName: f.fileName,
        })),
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="font-medium mb-1">Drag and drop your images here</p>
        <p className="text-sm text-muted-foreground mb-4">
          or click to select files (Max 50 files, 10MB each)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          Select Files
        </Button>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">
            {files.length} file{files.length !== 1 ? "s" : ""} selected
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {file.status === "uploading" && (
                    <div className="mt-1 bg-muted rounded-full h-1 w-full">
                      <div
                        className="bg-primary h-1 rounded-full transition-all"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-2">
                  {file.status === "success" && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {file.status === "error" && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  {file.status !== "success" && file.status !== "error" && (
                    <button
                      onClick={() => handleRemoveFile(file.id)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <Button
          onClick={handleUpload}
          disabled={createBatchMutation.isPending || addFilesToBatchMutation.isPending}
          className="w-full"
        >
          {createBatchMutation.isPending ? "Uploading..." : "Upload All Files"}
        </Button>
      )}
    </div>
  );
}
