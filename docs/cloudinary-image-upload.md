# Cloudinary Image Upload in Web3 App

This document provides a guide for the Cloudinary image upload functionality implemented in the Web3 application. This allows users to upload images for events and fundraising campaigns.

## Features

- Image uploading for events and fundraising campaigns
- Support for common image formats (JPG, PNG, JPEG, WebP)
- File size limitation (max 2MB)
- Automatic optimization of uploaded images
- Responsive image preview
- Error handling

## Components

### ImageUpload Component

Located at `components/image-upload.tsx`, this reusable component handles:
- Image uploads to Cloudinary
- Image preview display
- Removal of uploaded images
- Error handling

### Cloudinary Configuration

Located at `lib/cloudinary.ts`, this file provides:
- Configuration for Cloudinary API
- Helper functions for image optimization

### Environment Variables

These are stored in `.env.local`:
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `NEXT_PUBLIC_CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret (server-side only)
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`: Cloudinary upload preset

## Usage

### Basic Usage

```tsx
import { ImageUpload } from "@/components/image-upload";

function MyComponent() {
  const [imageUrl, setImageUrl] = useState("");
  
  return (
    <div>
      <label>Upload Image</label>
      <ImageUpload 
        value={imageUrl}
        onChange={setImageUrl}
        disabled={false}
      />
    </div>
  );
}
```

### Integration with Forms

```tsx
import { useState } from "react";
import { ImageUpload } from "@/components/image-upload";

function EventForm() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: ""
  });
  
  const handleImageChange = (url: string) => {
    setFormData(prev => ({ ...prev, image: url }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Submit form with image URL
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Event Image</label>
        <ImageUpload 
          value={formData.image}
          onChange={handleImageChange}
        />
      </div>
      {/* Other form fields */}
    </form>
  );
}
```

## Image Optimization

Use the `getOptimizedImageUrl` function to optimize images for different contexts:

```tsx
import { getOptimizedImageUrl } from "@/lib/cloudinary";

// Get optimized event banner
const optimizedBanner = getOptimizedImageUrl(event.bannerImage, 1200, 600, 80);

// Get optimized thumbnail
const thumbnail = getOptimizedImageUrl(event.bannerImage, 300, 200, 70);
```

## Custom Hook

You can also use the `useOptimizedImage` hook for React components:

```tsx
import { useOptimizedImage } from "@/lib/hooks/use-optimized-image";

function EventCard({ event }) {
  const { url: imageUrl } = useOptimizedImage(event.bannerImage, {
    width: 400,
    height: 300,
  });
  
  return (
    <div className="card">
      <img src={imageUrl} alt={event.title} />
      <h3>{event.title}</h3>
    </div>
  );
}
```

## Recommended Image Sizes

- Event banners: 1200×600px
- Fundraising campaign images: 1200×600px
- Thumbnails: 400×300px

## Troubleshooting

If you encounter issues with image uploads:

1. Check browser console for specific error messages
2. Verify Cloudinary credentials in `.env.local` file
3. Ensure image file size is under 2MB
4. Verify supported file formats (JPG, PNG, JPEG, WebP)
