import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Gauge as SpeedIcon, 
  History as HistoryIcon, 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  User, 
  Sun, 
  Moon, 
  Car,
  Activity,
  Menu,
  X
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useProfile } from '../context/ProfileContext';
import api from '../api';

export const Navbar = () => {
  const { settings, toggleTheme } = useSettings();
  const { profile, getInitials } = useProfile();
  const location = useLocation();
  const [apiOnline, setApiOnline] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        await api.getHealth();
        if (isMounted) setApiOnline(true);
      } catch (e) {
        if (isMounted) setApiOnline(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { name: 'Predictor', path: '/', icon: SpeedIcon },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'History', path: '/history', icon: HistoryIcon },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#0b0f1a]/80 dark:bg-[#0b0f1a]/80 light:bg-white/80 border-b border-white/10 dark:border-white/10 light:border-slate-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <NavLink to="/" className="flex items-center space-x-3 group">
            <div className="relative p-2 rounded-xl bg-gradient-to-tr from-[#2f7bff] to-[#ff7a2f] shadow-glow group-hover:scale-105 transition-transform duration-300">
              <Car className="w-6 h-6 text-white" />
              <div className="absolute inset-0 rounded-xl bg-white/20 blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-tech text-xl sm:text-2xl font-bold tracking-wider text-white dark:text-white light:text-slate-900">
                  RIDER<span className="text-[#2f7bff]">_AI</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#2f7bff]/20 text-[#2f7bff] border border-[#2f7bff]/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-1 hidden sm:block tracking-wide">
                Intelligent Vehicle Valuation
              </p>
            </div>
          </NavLink>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white dark:text-white light:text-blue-600 bg-white/10 dark:bg-white/10 light:bg-blue-50 shadow-inner'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-slate-100 light:text-slate-600'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#2f7bff]' : ''}`} />
                  <span>{link.name}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-[#2f7bff] to-[#ff7a2f] shadow-glow" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right actions: Status pill, theme toggle, and Profile Avatar */}
          <div className="flex items-center space-x-3">
            {/* API Status Pill */}
            <div 
              title={apiOnline ? 'FastAPI & ML Pipeline Connected' : 'Backend Connecting...'} 
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                apiOnline === true
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : apiOnline === false
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                apiOnline === true ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`} />
              <span>{apiOnline ? 'Model Online' : 'Connecting'}</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-white/10 dark:border-white/10 light:border-slate-200 bg-white/5 hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
              title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Theme"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-400 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Circular Profile Avatar */}
            <NavLink
              to="/profile"
              title={`Profile (${profile?.fullName || 'User'})`}
              className={`flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-[#2f7bff] to-[#ff7a2f] text-xs font-bold text-white shadow-glow hover:scale-105 transition-all ${
                location.pathname === '/profile'
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0b0f1a]'
                  : ''
              }`}
            >
              <span>{getInitials(profile?.fullName)}</span>
            </NavLink>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-white/10 bg-white/5 text-slate-300"
              aria-label="Open Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0b0f1a]/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium ${
                  isActive
                    ? 'text-white bg-[#2f7bff]/20 border border-[#2f7bff]/30'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#2f7bff]' : 'text-slate-400'}`} />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default Navbar;
