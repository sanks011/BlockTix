"use client";

import { useMemo } from "react";
import { getOptimizedImageUrl } from "../cloudinary";

interface UseOptimizedImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  fallback?: string;
}

const DEFAULT_OPTIONS: UseOptimizedImageOptions = {
  width: 600,
  height: 400,
  quality: 80,
  fallback: "/placeholder.jpg",
};

/**
 * Custom hook to get optimized image URLs from Cloudinary
 */
export function useOptimizedImage(url: string | undefined | null, options: UseOptimizedImageOptions = {}) {
  const { width, height, quality, fallback } = { ...DEFAULT_OPTIONS, ...options };

  const optimizedUrl = useMemo(() => {
    if (!url) return fallback;
    return getOptimizedImageUrl(url, width, height, quality);
  }, [url, width, height, quality, fallback]);

  return {
    url: optimizedUrl,
    isPlaceholder: !url,
    width,
    height,
  };
}
