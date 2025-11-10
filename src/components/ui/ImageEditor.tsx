/**
 * ImageEditor Component
 * Provides crop and edit functionality before image upload
 */

import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog';
import { Button } from './button';
import { Slider } from './slider';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Square, RectangleHorizontal, Maximize } from 'lucide-react';

const ASPECT_RATIOS = [
  { label: '1:1', value: 1, icon: Square },
  { label: '4:3', value: 4 / 3, icon: RectangleHorizontal },
  { label: '16:9', value: 16 / 9, icon: RectangleHorizontal },
  { label: 'Free', value: undefined, icon: Maximize },
] as const;

interface ImageEditorProps {
  imageUrl: string;
  onComplete: (croppedBlob: Blob, croppedUrl: string) => void;
  onCancel: () => void;
  open: boolean;
}

export function ImageEditor({ imageUrl, onComplete, onCancel, open }: ImageEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(16 / 9);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAspectRatioChange = (newAspect: number | undefined) => {
    setAspectRatio(newAspect);
    // Reset crop position when changing aspect ratio
    setCrop({ x: 0, y: 0 });
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = useCallback(async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const image = await createImage(imageUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Could not get canvas context');

      const maxSize = 2048;
      const safeArea = Math.max(image.width, image.height) * 2;

      // Set canvas size
      canvas.width = safeArea;
      canvas.height = safeArea;

      // Translate and rotate
      ctx.translate(safeArea / 2, safeArea / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-safeArea / 2, -safeArea / 2);

      // Draw rotated image
      ctx.drawImage(
        image,
        safeArea / 2 - image.width / 2,
        safeArea / 2 - image.height / 2
      );

      // Get cropped area
      const data = ctx.getImageData(
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Set canvas to final size
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Clear and draw cropped image
      ctx.putImageData(data, 0, 0);

      // Resize if needed
      if (canvas.width > maxSize || canvas.height > maxSize) {
        const scale = maxSize / Math.max(canvas.width, canvas.height);
        const resizedCanvas = document.createElement('canvas');
        const resizedCtx = resizedCanvas.getContext('2d');

        if (!resizedCtx) throw new Error('Could not get canvas context');

        resizedCanvas.width = canvas.width * scale;
        resizedCanvas.height = canvas.height * scale;
        resizedCtx.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);

        return resizedCanvas;
      }

      return canvas;
    } catch (error) {
      console.error('Error creating cropped image:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [imageUrl, croppedAreaPixels, rotation]);

  const handleComplete = async () => {
    try {
      const canvas = await createCroppedImage();
      if (!canvas) return;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Failed to create blob');
            return;
          }
          const croppedUrl = URL.createObjectURL(blob);
          onComplete(blob, croppedUrl);
        },
        'image/jpeg',
        0.9
      );
    } catch (error) {
      console.error('Failed to crop image:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Crop & Edit Image</DialogTitle>
        </DialogHeader>

        <div className="flex-1 relative bg-muted rounded-lg overflow-hidden">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            restrictPosition={false}
          />
        </div>

        <div className="space-y-4 pt-4">
          {/* Aspect Ratio Control */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Aspect Ratio</label>
            <div className="flex gap-2">
              {ASPECT_RATIOS.map((ratio) => {
                const Icon = ratio.icon;
                return (
                  <Button
                    key={ratio.label}
                    type="button"
                    variant={aspectRatio === ratio.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleAspectRatioChange(ratio.value)}
                    className="flex-1"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {ratio.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                Zoom
              </label>
              <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
            </div>
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Rotation Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <RotateCw className="h-4 w-4" />
                Rotation
              </label>
              <span className="text-sm text-muted-foreground">{rotation}°</span>
            </div>
            <Slider
              value={[rotation]}
              onValueChange={([value]) => setRotation(value)}
              min={0}
              max={360}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleComplete}
            disabled={isProcessing}
          >
            <Check className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to create image from URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
