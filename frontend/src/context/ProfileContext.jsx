import React, { createContext, useContext, useState, useEffect } from 'react';

const defaultProfile = {
  fullName: 'Guest User',
  email: 'guest@rider.ai',
  phone: '',
  city: '',
  preferredBrand: 'Maruti',
};

const ProfileContext = createContext(null);

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('rider_ai_profile');
      if (saved) {
        return { ...defaultProfile, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse profile from localStorage', e);
    }
    return defaultProfile;
  });

  useEffect(() => {
    try {
      localStorage.setItem('rider_ai_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save profile to localStorage', e);
    }
  }, [profile]);

  const updateProfile = (partial) => {
    setProfile((prev) => ({ ...prev, ...partial }));
  };

  const resetProfile = () => {
    setProfile(defaultProfile);
    try {
      localStorage.removeItem('rider_ai_profile');
    } catch (e) {
      console.warn(e);
    }
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'GU';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile,
        resetProfile,
        getInitials,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
