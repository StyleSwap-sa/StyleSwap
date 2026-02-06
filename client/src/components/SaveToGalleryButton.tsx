import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useSaveToGallery } from '@/hooks/useSaveToGallery';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SaveToGalleryButtonProps {
  imageUrl?: string;
  canvas?: HTMLCanvasElement;
  element?: HTMLElement;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

/**
 * Button component for saving try-on results to phone gallery
 * Supports image URL, canvas, or HTML element
 */
export function SaveToGalleryButton({
  imageUrl,
  canvas,
  element,
  onSuccess,
  onError,
  variant = 'default',
  size = 'default',
  className = '',
}: SaveToGalleryButtonProps) {
  const { isSaving, isSuccess, error, saveImage, saveCanvas, saveElement, reset } =
    useSaveToGallery();
  const [isOpen, setIsOpen] = useState(false);
  const [filename, setFilename] = useState('StyleSwap-TryOn');
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');

  const handleSave = async () => {
    try {
      const fullFilename = `${filename}.${format === 'png' ? 'png' : 'jpg'}`;

      if (imageUrl) {
        await saveImage(imageUrl, { filename: fullFilename, format });
      } else if (canvas) {
        await saveCanvas(canvas, { filename: fullFilename, format });
      } else if (element) {
        await saveElement(element, { filename: fullFilename, format });
      }

      onSuccess?.();
      setIsOpen(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save';
      onError?.(errorMsg);
    }
  };

  // Show success state
  if (isSuccess) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
      >
        <Check className="w-4 h-4 mr-2" />
        Saved to Gallery!
      </Button>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          variant="destructive"
          size={size}
          className={className}
          disabled
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="w-full"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Show loading state
  if (isSaving) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
      >
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Saving...
      </Button>
    );
  }

  // Show default state
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={!imageUrl && !canvas && !element}
        >
          <Download className="w-4 h-4 mr-2" />
          Save to Gallery
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Try-On to Gallery</DialogTitle>
          <DialogDescription>
            Choose a filename and format for your try-on result
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              placeholder="StyleSwap-TryOn"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Extension will be added automatically
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as 'png' | 'jpeg')}>
              <SelectTrigger id="format" disabled={isSaving}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (Lossless)</SelectItem>
                <SelectItem value="jpeg">JPEG (Compressed)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              PNG is higher quality, JPEG is smaller file size
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
