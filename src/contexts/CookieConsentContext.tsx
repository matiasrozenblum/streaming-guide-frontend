'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CookieConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface CookieConsentContextType {
  consent: CookieConsentState | null;
  showBanner: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (preferences: CookieConsentState) => void;
  hasConsent: (type: keyof CookieConsentState) => boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  showPreferences: boolean;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

const CONSENT_KEY = 'cookie-consent';
const CONSENT_VERSION = '1.0'; // Increment this when privacy policy changes

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsentState | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const savedConsent = localStorage.getItem(CONSENT_KEY);
    
    if (savedConsent) {
      try {
        const consentData = JSON.parse(savedConsent);
        
        // Check if consent version matches (only re-ask if privacy policy changes)
        if (consentData.version === CONSENT_VERSION) {
          setConsent(consentData.preferences);
          setShowBanner(false);
        } else {
          // Version changed (privacy policy updated), show banner again
          setShowBanner(true);
        }
      } catch (error) {
        console.error('Error parsing saved consent:', error);
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  const saveConsentToStorage = (preferences: CookieConsentState) => {
    const consentData = {
      preferences,
      version: CONSENT_VERSION,
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
  };

  const acceptAll = () => {
    const allAccepted: CookieConsentState = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setConsent(allAccepted);
    saveConsentToStorage(allAccepted);
    setShowBanner(false);
    setShowPreferences(false);
    
    // Reload to initialize tracking scripts
    window.location.reload();
  };

  const rejectAll = () => {
    const onlyNecessary: CookieConsentState = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    setConsent(onlyNecessary);
    saveConsentToStorage(onlyNecessary);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const savePreferences = (preferences: CookieConsentState) => {
    // Always ensure necessary cookies are enabled
    const finalPreferences = { ...preferences, necessary: true };
    setConsent(finalPreferences);
    saveConsentToStorage(finalPreferences);
    setShowBanner(false);
    setShowPreferences(false);
    
    // Reload to apply new preferences
    window.location.reload();
  };

  const hasConsent = (type: keyof CookieConsentState): boolean => {
    if (!consent) return false;
    return consent[type];
  };

  const openPreferences = () => {
    setShowPreferences(true);
  };

  const closePreferences = () => {
    setShowPreferences(false);
  };

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        showBanner,
        acceptAll,
        rejectAll,
        savePreferences,
        hasConsent,
        openPreferences,
        closePreferences,
        showPreferences,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
} 