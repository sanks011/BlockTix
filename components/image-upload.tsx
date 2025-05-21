"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import { ImageIcon, X, Upload, Loader2 } from "lucide-react";

// Define proper types for Cloudinary results
// Cloudinary types from next-cloudinary
interface CloudinaryWidgetResult {
  event: string;
  info: {
    secure_url: string;
    public_id: string;
    asset_id?: string;
    resource_type?: string;
    [key: string]: any;
  };
}

interface ImageUploadProps {
  onChange: (url: string) => void;
  value: string;
  disabled?: boolean;
}

export function ImageUpload({ onChange, value, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);    const uploadToCloudinary = useCallback(
    async (file: File) => {
      if (!file) return;
      
      setIsUploading(true);
      setError(null);
      
      // Using cloud name directly from config to ensure it's correct
      const UPLOAD_URL = `https://api.cloudinary.com/v1_1/dkf25yvzj/image/upload`;
        const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', "ml_default"); // Using unsigned upload preset
      formData.append('timestamp', String(Math.floor(Date.now() / 1000)));
      
      try {
        console.log("Uploading to Cloudinary:", UPLOAD_URL);
        console.log("Upload file type:", file.type);
        console.log("Upload file size:", file.size);
        
        const response = await fetch(
          UPLOAD_URL,
          {
            method: 'POST',
            body: formData,
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Upload response not OK:", response.status, response.statusText);
          console.error("Error details:", errorText);
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Upload successful:", data);
        
        if (data && data.secure_url) {
          onChange(data.secure_url);
        } else {
          throw new Error('Invalid response from Cloudinary');
        }
      } catch (err) {
        console.error("Error uploading to Cloudinary:", err);
        setError("Error uploading image. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [onChange]
  );
  
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Validate file type
        if (!/^image\/(jpeg|png|jpg|webp)$/.test(file.type)) {
          setError("Please select a valid image file (JPG, PNG, or WebP)");
          return;
        }
        
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          setError("Image size should be less than 2MB");
          return;
        }
        
        uploadToCloudinary(file);
      }
    },
    [uploadToCloudinary]
  );
  
  const handleButtonClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    onChange("");
  }, [onChange]);
  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col items-center justify-center gap-4">
        {value && (
          <div className="relative w-full max-w-[300px] aspect-video rounded-md overflow-hidden">
            <img 
              src={value} 
              alt="Uploaded image" 
              className="h-full w-full object-cover"
            />
            <Button
              onClick={handleRemoveImage}
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7"
              disabled={isUploading || disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {!value && (
          <div className="w-full max-w-[300px] aspect-video relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-700 rounded-md p-4">
            <ImageIcon className="h-10 w-10 text-zinc-500" />
            <p className="text-xs text-zinc-500">No image selected</p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      
      <div className="flex justify-center">
        {/* Hidden file input */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/jpg,image/webp"
          className="hidden"
          disabled={isUploading || disabled}
        />
        
        {isUploading ? (
          <Button disabled type="button" className="bg-purple-600">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </Button>
        ) : (
          <Button
            onClick={handleButtonClick}
            disabled={disabled}
            type="button"
            className={value ? 
              "border-purple-600 text-purple-600 hover:bg-purple-600/10" :
              "bg-purple-600 hover:bg-purple-700"
            }
            variant={value ? "outline" : "default"}
          >
            <Upload className="mr-2 h-4 w-4" />
            {value ? "Change Image" : "Upload Image"}
          </Button>
        )}
      </div>
    </div>
  );
}