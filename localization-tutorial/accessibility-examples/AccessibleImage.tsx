import React from 'react';
import { useTranslation } from 'react-i18next';

interface AccessibleImageProps {
  src: string;
  altKey: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Accessible image component with localized alt text
 * 
 * Features:
 * - Localized alt text from translation keys
 * - Proper loading states
 * - Error handling with localized messages
 * - Screen reader announcements
 */
export const AccessibleImage: React.FC<AccessibleImageProps> = ({
  src,
  altKey,
  className = '',
  loading = 'lazy'
}) => {
  const { t } = useTranslation();
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  
  const handleLoad = () => {
    setImageLoading(false);
  };
  
  const handleError = () => {
    setImageLoading(false);
    setImageError(true);
  };
  
  if (imageError) {
    return (
      <div 
        className={`image-error ${className}`}
        role="img"
        aria-label={t(`${altKey}.error`)}
      >
        <span aria-hidden="true">⚠️</span>
        <span className="sr-only">{t(`${altKey}.error`)}</span>
      </div>
    );
  }
  
  return (
    <div className={`image-wrapper ${className}`}>
      {imageLoading && (
        <div 
          className="image-loading"
          role="status"
          aria-label={t(`${altKey}.loading`)}
        >
          <span className="sr-only">{t(`${altKey}.loading`)}</span>
        </div>
      )}
      <img
        src={src}
        alt={t(altKey)}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        aria-busy={imageLoading}
      />
    </div>
  );
};

export default AccessibleImage;
