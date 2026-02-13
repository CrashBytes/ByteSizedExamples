import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type AnnouncementPriority = 'polite' | 'assertive';

interface Announcement {
  id: string;
  message: string;
  priority: AnnouncementPriority;
  timestamp: number;
}

/**
 * Screen reader announcement component for dynamic content updates
 * 
 * Features:
 * - Localized announcements
 * - Configurable priority (polite/assertive)
 * - Automatic announcement clearing
 * - Status updates for async operations
 * 
 * Usage:
 * const { announce } = useScreenReaderAnnouncements();
 * announce(t('status.saved'), 'polite');
 */
export const ScreenReaderAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  useEffect(() => {
    // Clear old announcements after 5 seconds
    const interval = setInterval(() => {
      const now = Date.now();
      setAnnouncements(prev => 
        prev.filter(a => now - a.timestamp < 5000)
      );
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <>
      {/* Polite announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements
          .filter(a => a.priority === 'polite')
          .map(a => (
            <div key={a.id}>{a.message}</div>
          ))}
      </div>
      
      {/* Assertive announcements */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements
          .filter(a => a.priority === 'assertive')
          .map(a => (
            <div key={a.id}>{a.message}</div>
          ))}
      </div>
    </>
  );
};

/**
 * Hook to create screen reader announcements
 */
export const useScreenReaderAnnouncements = () => {
  const announce = (
    message: string,
    priority: AnnouncementPriority = 'polite'
  ) => {
    const announcement: Announcement = {
      id: `announcement-${Date.now()}`,
      message,
      priority,
      timestamp: Date.now()
    };
    
    // Dispatch custom event
    const event = new CustomEvent('screenreader-announcement', {
      detail: announcement
    });
    window.dispatchEvent(event);
  };
  
  return { announce };
};

/**
 * Example usage component demonstrating announcements
 */
export const AnnouncementExample: React.FC = () => {
  const { t } = useTranslation();
  const { announce } = useScreenReaderAnnouncements();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const handleSave = async () => {
    setSaving(true);
    announce(t('status.saving'), 'polite');
    
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSaving(false);
    announce(t('status.saved'), 'polite');
  };
  
  const handleUpload = async () => {
    setUploading(true);
    const filename = 'example.pdf';
    announce(t('status.uploading', { filename }), 'polite');
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setUploading(false);
    announce(t('status.uploadComplete', { filename }), 'polite');
  };
  
  const handleError = () => {
    announce(t('status.error'), 'assertive');
  };
  
  return (
    <div>
      <h3>Screen Reader Announcements Demo</h3>
      
      <button 
        onClick={handleSave} 
        disabled={saving}
        aria-busy={saving}
      >
        {saving ? t('status.saving') : t('forms.save')}
      </button>
      
      <button 
        onClick={handleUpload} 
        disabled={uploading}
        aria-busy={uploading}
      >
        {uploading ? t('status.uploading', { filename: 'file' }) : t('upload.chooseFile')}
      </button>
      
      <button onClick={handleError}>
        Trigger Error
      </button>
      
      <ScreenReaderAnnouncements />
    </div>
  );
};

export default ScreenReaderAnnouncements;
