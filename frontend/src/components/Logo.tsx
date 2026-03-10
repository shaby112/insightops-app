import { useState, useEffect } from "react";
import logoImage from "@/assets/logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-7",
  md: "h-9",
  lg: "h-12",
};

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

// Cache the logo image in memory and localStorage for faster loading
const LOGO_CACHE_KEY = "kuantra-logo-cached";
let cachedLogoUrl: string | null = null;

function useCachedLogo() {
  const [logoUrl, setLogoUrl] = useState<string>(cachedLogoUrl || logoImage);
  const [isLoaded, setIsLoaded] = useState(!!cachedLogoUrl);

  useEffect(() => {
    // Check if we already have a cached blob URL
    if (cachedLogoUrl) {
      setLogoUrl(cachedLogoUrl);
      setIsLoaded(true);
      return;
    }

    // Try to load from localStorage cache
    const cached = localStorage.getItem(LOGO_CACHE_KEY);
    if (cached) {
      try {
        cachedLogoUrl = cached;
        setLogoUrl(cached);
        setIsLoaded(true);
        return;
      } catch (e) {
        // Invalid cache, continue to fetch
      }
    }

    // Preload the logo image
    const img = new Image();
    img.onload = () => {
      // Create a canvas to convert to data URL for caching
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          
          // Cache in memory and localStorage
          cachedLogoUrl = dataUrl;
          try {
            localStorage.setItem(LOGO_CACHE_KEY, dataUrl);
          } catch (e) {
            // localStorage might be full, just use memory cache
          }
          setLogoUrl(dataUrl);
        }
      } catch (e) {
        // CORS or other error, just use original
      }
      setIsLoaded(true);
    };
    img.onerror = () => {
      setIsLoaded(true);
    };
    img.crossOrigin = "anonymous";
    img.src = logoImage;
  }, []);

  return { logoUrl, isLoaded };
}

export function Logo({ showText = true, size = "md", className }: LogoProps) {
  const { logoUrl, isLoaded } = useCachedLogo();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src={logoUrl}
        alt="Kuantra Logo"
        className={cn(
          sizeClasses[size], 
          "w-auto object-contain transition-opacity duration-200",
          !isLoaded && "opacity-0"
        )}
        loading="eager"
        decoding="async"
      />
      {showText && (
        <span className={cn("font-bold text-gradient-primary", textSizeClasses[size])}>
          Kuantra
        </span>
      )}
    </div>
  );
}
