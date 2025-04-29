import Image from "next/image";

type IconSize = "sm" | "md" | "lg" | "xl";

interface IconProps {
  name: "favicon" | "android-chrome" | "apple-touch";
  size?: IconSize;
  alt?: string;
  className?: string;
}

const iconSizes: Record<IconSize, number> = {
  sm: 16,
  md: 32,
  lg: 64,
  xl: 128,
};

// Updated path mapping to ensure all icons are correctly referenced
const iconPaths: Record<string, string> = {
  "favicon-sm": "/favicon-16x16.png",
  "favicon-md": "/favicon-32x32.png",
  "favicon-lg": "/favicon.ico",
  "favicon-xl": "/favicon.ico",
  "android-chrome-sm": "/android-chrome-512x512.png",
  "android-chrome-md": "/android-chrome-512x512.png",
  "android-chrome-lg": "/android-chrome-512x512.png",
  "android-chrome-xl": "/android-chrome-512x512.png",
  "apple-touch-sm": "/apple-touch-icon.png",
  "apple-touch-md": "/apple-touch-icon.png",
  "apple-touch-lg": "/apple-touch-icon.png",
  "apple-touch-xl": "/apple-touch-icon.png",
};

export default function Icon({
  name,
  size = "md",
  alt = "Icon",
  className = "",
}: IconProps) {
  // Get the correct icon path or fall back to a default
  const iconPath = iconPaths[`${name}-${size}`] || "/favicon.ico";
  const dimensions = iconSizes[size];

  return (
    <span className={`inline-block ${className}`}>
      <Image
        src={iconPath}
        width={dimensions}
        height={dimensions}
        alt={alt}
        priority={true} // Add priority to ensure icons load early
      />
    </span>
  );
}
