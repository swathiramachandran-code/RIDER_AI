import React, { createContext, useContext, useState, useEffect } from 'react';

const defaultSettings = {
  theme: 'dark',
  currency: 'INR',
  usdRate: 83.0,
  distanceUnit: 'km',
  defaultBrand: 'Maruti',
  defaultFuel: 'Petrol',
  compactTable: false,
};

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('rider_ai_settings') || localStorage.getItem('autoworth_settings');
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse settings from localStorage', e);
    }
    return defaultSettings;
  });

  // Apply theme to document HTML class
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('rider_ai_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  const updateSettings = (partial) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    try {
      localStorage.removeItem('autoworth_settings');
    } catch (e) {
      console.warn(e);
    }
  };

  /**
   * Format resale price according to selected currency
   */
  const formatPrice = (priceInINR, showDecimals = false) => {
    if (priceInINR === null || priceInINR === undefined || isNaN(priceInINR)) {
      return '—';
    }

    if (settings.currency === 'USD') {
      const rate = settings.usdRate > 0 ? settings.usdRate : 83.0;
      const inUSD = priceInINR / rate;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: showDecimals ? 2 : 0,
      }).format(inUSD);
    }

    // Default INR format
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(priceInINR);
  };

  /**
   * Format distance according to selected unit (km or miles)
   */
  const formatDistance = (km) => {
    if (km === null || km === undefined || isNaN(km)) return '—';

    if (settings.distanceUnit === 'miles') {
      const miles = Math.round(km * 0.621371);
      return `${miles.toLocaleString()} mi`;
    }

    return `${Number(km).toLocaleString()} km`;
  };

  /**
   * Convert user inputted distance back to KM for API consumption
   */
  const distanceToKm = (val) => {
    const num = parseFloat(val) || 0;
    if (settings.distanceUnit === 'miles') {
      return Math.round(num / 0.621371);
    }
    return Math.round(num);
  };

  /**
   * Convert KM into current user display distance
   */
  const kmToDisplayDistance = (km) => {
    if (settings.distanceUnit === 'miles') {
      return Math.round((km || 0) * 0.621371);
    }
    return Math.round(km || 0);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        toggleTheme,
        resetSettings,
        formatPrice,
        formatDistance,
        distanceToKm,
        kmToDisplayDistance,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
