import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  DollarSign, 
  IndianRupee, 
  Gauge, 
  RotateCcw, 
  Trash2, 
  Check, 
  Sparkles,
  Sliders,
  TableProperties
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import api from '../api';
import Toast from '../components/Toast';

export const Settings = () => {
  const { settings, updateSettings, resetSettings } = useSettings();

  const [metadata, setMetadata] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const data = await api.getMetadata();
        setMetadata(data);
      } catch (err) {
        console.warn('Could not load metadata in settings', err);
      }
    };
    loadMeta();
  }, []);

  const handleClearHistory = async () => {
    try {
      await api.clearHistory();
      setConfirmClearHistory(false);
      setToastType('success');
      setToastMessage('Valuation history cleared successfully.');
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage('Failed to clear history database.');
    }
  };

  const handleResetSettings = () => {
    resetSettings();
    setToastType('info');
    setToastMessage('All settings reset to default values.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#2f7bff]/15 text-[#38bdf8] border border-[#2f7bff]/30 mb-2">
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Application Preferences</span>
        </div>
        <h1 className="font-tech text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          System & Pro Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Customize UI aesthetics, currency localization, distance conversions, and pre-filled form parameters.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* 1. Theme Preferences */}
        <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="font-tech text-lg font-bold text-white flex items-center space-x-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Appearance & Theme</span>
              </h3>
              <p className="text-xs text-slate-400">
                Choose between dark automotive neon dashboard or clean daylight contrast
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Dark Theme Option */}
            <button
              type="button"
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`p-4 rounded-2xl border text-left flex items-start space-x-3 transition-all ${
                settings.theme === 'dark'
                  ? 'bg-[#2f7bff]/15 border-[#2f7bff] shadow-glow'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-[#0b0f1a] text-[#38bdf8] border border-white/10 shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-tech font-bold text-white text-base">Dark Dashboard</span>
                  {settings.theme === 'dark' && <Check className="w-4 h-4 text-[#2f7bff]" />}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  High-contrast deep #0b0f1a canvas with electric-blue & orange neon accents.
                </p>
              </div>
            </button>

            {/* Light Theme Option */}
            <button
              type="button"
              onClick={() => updateSettings({ theme: 'light' })}
              className={`p-4 rounded-2xl border text-left flex items-start space-x-3 transition-all ${
                settings.theme === 'light'
                  ? 'bg-blue-500/15 border-blue-500 shadow-glow'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-slate-100 text-amber-500 border border-slate-200 shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-tech font-bold text-white text-base">Light Daylight</span>
                  {settings.theme === 'light' && <Check className="w-4 h-4 text-blue-500" />}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Clean daylight slate canvas with sharp typography and soft card shadows.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Currency & Units Localization */}
        <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="font-tech text-lg font-bold text-white flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Currency & Distance Localization</span>
            </h3>
            <p className="text-xs text-slate-400">
              Prices are internally modeled in ₹ INR and converted purely for display
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Currency Choice */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Display Currency
              </label>
              <div className="grid grid-cols-2 gap-2 bg-[#0b0f1a]/80 p-1.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => updateSettings({ currency: 'INR' })}
                  className={`py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    settings.currency === 'INR'
                      ? 'bg-[#2f7bff] text-white shadow-glow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>INR (₹)</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ currency: 'USD' })}
                  className={`py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    settings.currency === 'USD'
                      ? 'bg-[#2f7bff] text-white shadow-glow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>USD ($)</span>
                </button>
              </div>

              {/* Editable USD Exchange Rate */}
              {settings.currency === 'USD' && (
                <div className="pt-2 space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-400">
                    USD to INR Conversion Rate (1 USD = ₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={settings.usdRate}
                    onChange={(e) => updateSettings({ usdRate: parseFloat(e.target.value) || 83.0 })}
                    className="w-full bg-[#0b0f1a]/80 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#2f7bff]"
                  />
                </div>
              )}
            </div>

            {/* Distance Unit Choice */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Odometer Distance Unit
              </label>
              <div className="grid grid-cols-2 gap-2 bg-[#0b0f1a]/80 p-1.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => updateSettings({ distanceUnit: 'km' })}
                  className={`py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    settings.distanceUnit === 'km'
                      ? 'bg-[#ff7a2f] text-white shadow-glow-orange'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span>Kilometres (km)</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ distanceUnit: 'miles' })}
                  className={`py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    settings.distanceUnit === 'miles'
                      ? 'bg-[#ff7a2f] text-white shadow-glow-orange'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span>Miles (mi)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Form Defaults & Table Mode */}
        <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="font-tech text-lg font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-[#38bdf8]" />
              <span>Predictor Defaults & Table Layout</span>
            </h3>
            <p className="text-xs text-slate-400">
              Set pre-filled options for fast repeated appraisals
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Default Brand */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Default Brand
              </label>
              <select
                value={settings.defaultBrand}
                onChange={(e) => updateSettings({ defaultBrand: e.target.value })}
                className="w-full bg-[#0b0f1a]/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2f7bff] cursor-pointer"
              >
                {(metadata?.brands || ['Maruti', 'Hyundai', 'Honda', 'Toyota']).map((b) => (
                  <option key={b} value={b} className="bg-[#0b0f1a] text-white">
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Default Fuel */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Default Fuel
              </label>
              <select
                value={settings.defaultFuel}
                onChange={(e) => updateSettings({ defaultFuel: e.target.value })}
                className="w-full bg-[#0b0f1a]/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2f7bff] cursor-pointer"
              >
                {(metadata?.fuels || ['Petrol', 'Diesel', 'CNG', 'Electric']).map((f) => (
                  <option key={f} value={f} className="bg-[#0b0f1a] text-white">
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Compact Table Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                History Table Density
              </label>
              <button
                type="button"
                onClick={() => updateSettings({ compactTable: !settings.compactTable })}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors ${
                  settings.compactTable
                    ? 'bg-[#2f7bff]/20 border-[#2f7bff] text-white'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <TableProperties className="w-4 h-4 text-[#2f7bff]" />
                  <span>{settings.compactTable ? 'Compact Rows' : 'Comfortable'}</span>
                </span>
                <span className={`w-2 h-2 rounded-full ${settings.compactTable ? 'bg-[#2f7bff]' : 'bg-slate-500'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Danger Zone & Factory Reset */}
        <div className="glass-card rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-4">
            <div>
              <h3 className="font-tech text-lg font-bold text-rose-300 flex items-center space-x-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Data Management & Defaults</span>
              </h3>
              <p className="text-xs text-slate-400">
                Wipe database records or reset localStorage settings to initial state
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              type="button"
              onClick={() => setConfirmClearHistory(true)}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-300 transition-colors flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History Database</span>
            </button>

            <button
              type="button"
              onClick={handleResetSettings}
              className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-colors flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset All Settings</span>
            </button>
          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {confirmClearHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-2xl border border-rose-500/30 bg-[#0b0f1a] p-6 max-w-sm w-full space-y-4 shadow-2xl"
          >
            <h3 className="font-tech text-lg font-bold text-white">Clear All Prediction Records?</h3>
            <p className="text-xs text-slate-300">
              Are you sure? This will remove all vehicle valuation entries from the backend SQLite database.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmClearHistory(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg"
              >
                Confirm Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Settings;
