/**
 * Image Upload Component
 * Reusable drag-and-drop upload component with previews and progress
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Progress } from './progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ImageEditor } from './ImageEditor';

export interface ImageUploadProps {
  value?: string | string[];
  onChange: (urls: string | string[]) => void;
  onImageIdChange?: (imageIds: string | string[]) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: string[];
  bucket: 'fundraiser-images' | 'fundraiser-gallery' | 'fundraiser-drafts';
  isDraft?: boolean;
  fundraiserId?: string;
  showPreview?: boolean;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onImageIdChange,
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  bucket,
  isDraft = false,
  fundraiserId,
  showPreview = true,
  label,
  description,
  className,
  disabled = false,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previews, setPreviews] = useState<string[]>(
    Array.isArray(value) ? value : value ? [value] : []
  );
  const [imageIds, setImageIds] = useState<string[]>([]);
  const [editingImage, setEditingImage] = useState<{ url: string; file: File } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Sync previews with value prop changes (controlled component pattern)
  useEffect(() => {
    const newPreviews = Array.isArray(value) ? value : value ? [value] : [];
    
    console.log('[ImageUpload] Syncing from parent value', {
      value,
      currentPreviews: previews,
      newPreviews,
    });
    
    // Always update to match parent's value (it's the source of truth)
    setPreviews(newPreviews);
  }, [value]); // Only depend on value prop

  // Validate preview URLs
  const validPreviews = previews.filter(url => {
    try {
      new URL(url);
      return true;
    } catch {
      console.warn('[ImageUpload] Invalid preview URL:', url);
      return false;
    }
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    if (!accept.includes(file.type)) {
      return `Invalid file type. Please upload ${accept.map(t => t.split('/')[1].toUpperCase()).join(', ')}`;
    }
    if (file.size > maxSize) {
      return `File size exceeds ${maxSize / (1024 * 1024)}MB limit`;
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<{ url: string; imageId: string } | null> => {
    // Dynamic import to avoid circular dependencies
    const { storageService } = await import('@/lib/services/storage.service');
    const { supabase } = await import('@/integrations/supabase/client');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const result = await storageService.uploadFile(
        bucket,
        file,
        user.id,
        {
          fundraiserId,
          imageType: isDraft ? 'draft' : (maxFiles === 1 ? 'cover' : 'gallery'),
          onProgress: (progress) => setUploadProgress(progress * 100),
        }
      );
      return { url: result.url, imageId: result.imageId };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    const totalFiles = previews.length + fileArray.length;

    if (totalFiles > maxFiles) {
      toast({
        title: 'Too many files',
        description: `You can only upload ${maxFiles} file${maxFiles > 1 ? 's' : ''}`,
        variant: 'destructive',
      });
      return;
    }

    // Validate all files first
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast({
          title: 'Invalid file',
          description: error,
          variant: 'destructive',
        });
        return;
      }
    }

    // Open editor for the first file
    const file = fileArray[0];
    const imageUrl = URL.createObjectURL(file);
    setEditingImage({ url: imageUrl, file });
  };

  const handleEditorComplete = useCallback(async (croppedBlob: Blob, croppedUrl: string) => {
    setEditingImage(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Create a new File from the cropped blob
      const croppedFile = new File([croppedBlob], editingImage?.file.name || 'cropped-image.jpg', {
        type: 'image/jpeg',
      });

      console.log('[ImageUpload] Uploading cropped file:', croppedFile.name);
      const result = await uploadFile(croppedFile);
      console.log('[ImageUpload] Upload result:', result);

      if (!result) throw new Error('Upload failed');

      const updatedPreviews = [...previews, result.url];
      const updatedImageIds = [...imageIds, result.imageId];

      // ✅ Notify parent FIRST (source of truth)
      if (maxFiles === 1) {
        onChange(updatedPreviews[0] || '');
        onImageIdChange?.(updatedImageIds[0] || '');
      } else {
        onChange(updatedPreviews);
        onImageIdChange?.(updatedImageIds);
      }

      // Then update internal state
      setPreviews(updatedPreviews);
      setImageIds(updatedImageIds);

      toast({
        title: 'Upload successful',
        description: 'Image uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Clean up object URL
      if (editingImage) {
        URL.revokeObjectURL(editingImage.url);
      }
    }
  }, [editingImage, previews, imageIds, maxFiles, onChange, onImageIdChange, toast, uploadFile]);

  const handleEditorCancel = useCallback(() => {
    if (editingImage) {
      URL.revokeObjectURL(editingImage.url);
    }
    setEditingImage(null);
  }, [editingImage]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await handleFiles(e.dataTransfer.files);
      }
    },
    [previews, handleFiles]
  );

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    const newImageIds = imageIds.filter((_, i) => i !== index);

    setPreviews(newPreviews);
    setImageIds(newImageIds);

    if (maxFiles === 1) {
      onChange('');
      onImageIdChange?.('');
    } else {
      onChange(newPreviews);
      onImageIdChange?.(newImageIds);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <div>
          <label className="text-sm font-medium leading-none">{label}</label>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}

      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors',
          dragActive ? 'border-primary bg-primary/5' : 'border-border',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:border-primary/50 cursor-pointer'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={disabled ? undefined : handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={accept.join(',')}
          multiple={maxFiles > 1}
          disabled={disabled}
        />

        {uploading ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="w-full max-w-xs">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center mt-2">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          </div>
        ) : validPreviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium mb-1">
              Drag & drop or click to upload
            </p>
            <p className="text-xs text-muted-foreground">
              {accept.map(t => t.split('/')[1].toUpperCase()).join(', ')} up to {maxSize / (1024 * 1024)}MB
            </p>
          </div>
        ) : null}
      </div>

      {/* Preview Grid */}
      {showPreview && validPreviews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {validPreviews.map((preview, index) => (
            <div
              key={index}
              className="relative group aspect-video rounded-lg overflow-hidden border bg-muted"
            >
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('[ImageUpload] Image failed to load:', preview);
                  e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Failed to load</text></svg>';
                }}
                onLoad={() => {
                  console.log('[ImageUpload] Image loaded successfully:', preview);
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                disabled={disabled}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <div className="flex items-center text-white text-xs">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  <span className="truncate">Image {index + 1}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add More Button */}
      {validPreviews.length > 0 && validPreviews.length < maxFiles && !uploading && (
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={disabled}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Add More Images ({validPreviews.length}/{maxFiles})
        </Button>
      )}

      {/* Image Editor Modal */}
      {editingImage && (
        <ImageEditor
          imageUrl={editingImage.url}
          onComplete={handleEditorComplete}
          onCancel={handleEditorCancel}
          open={!!editingImage}
        />
      )}
    </div>
  );
}
