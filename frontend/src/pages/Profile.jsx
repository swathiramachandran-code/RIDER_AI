import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Car, 
  Settings as SettingsIcon, 
  RotateCcw, 
  Check, 
  Edit3, 
  X, 
  Calendar, 
  Activity, 
  TrendingUp, 
  History as HistoryIcon,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { useSettings } from '../context/SettingsContext';
import api from '../api';
import Toast from '../components/Toast';

export const Profile = () => {
  const { profile, updateProfile, resetProfile, getInitials } = useProfile();
  const { formatPrice, formatDistance } = useSettings();

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [brands, setBrands] = useState(['Maruti', 'Hyundai', 'Honda', 'Toyota', 'Tata', 'Mahindra']);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...profile });
  const [formErrors, setFormErrors] = useState({});

  // Confirmation modal
  const [confirmClearModal, setConfirmClearModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoadingHistory(true);
        const [histData, metaData] = await Promise.all([
          api.getHistory({ limit: 100 }).catch(() => []),
          api.getMetadata().catch(() => null),
        ]);
        if (isMounted) {
          setHistory(Array.isArray(histData) ? histData : []);
          if (metaData?.brands?.length) {
            setBrands(metaData.brands);
          }
        }
      } catch (err) {
        console.warn('Profile data load error:', err);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update local form when profile changes
  useEffect(() => {
    setFormData({ ...profile });
  }, [profile]);

  // Derived user statistics from history
  const stats = useMemo(() => {
    if (!history || history.length === 0) {
      return {
        total: 0,
        avgPrice: 0,
        topBrand: 'None',
        lastDate: 'No appraisals yet',
      };
    }

    const total = history.length;
    const prices = history.map((h) => Number(h.predicted_price) || 0).filter((p) => p > 0);
    const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

    // Most predicted brand
    const brandCounts = {};
    history.forEach((h) => {
      const b = h.brand || 'Other';
      brandCounts[b] = (brandCounts[b] || 0) + 1;
    });
    let topBrand = 'None';
    let maxCount = 0;
    Object.entries(brandCounts).forEach(([b, c]) => {
      if (c > maxCount) {
        maxCount = c;
        topBrand = b;
      }
    });

    // Last prediction date
    const lastPrediction = history[0]; // ordered newest first
    const lastDate = lastPrediction?.created_at
      ? new Date(lastPrediction.created_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'None';

    return { total, avgPrice, topBrand, lastDate };
  }, [history]);

  // Recent 5 predictions
  const recentPredictions = useMemo(() => {
    return history.slice(0, 5);
  }, [history]);

  // Form Validation
  const validate = () => {
    const errors = {};
    if (!formData.fullName || !formData.fullName.trim()) {
      errors.fullName = 'Full Name is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email Address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email format (e.g., name@example.com).';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!validate()) return;

    updateProfile({
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      city: formData.city.trim(),
      preferredBrand: formData.preferredBrand,
    });
    setIsEditing(false);
    setToastType('success');
    setToastMessage('Profile details updated successfully!');
  };

  const handleCancelEdit = () => {
    setFormData({ ...profile });
    setFormErrors({});
    setIsEditing(false);
  };

  const handleClearProfile = () => {
    resetProfile();
    setConfirmClearModal(false);
    setIsEditing(false);
    setToastType('info');
    setToastMessage('Profile data has been reset to default values.');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
          <User className="w-3.5 h-3.5" />
          <span>User Account & Portfolio</span>
        </div>
        <h1 className="font-tech text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Driver & Valuator Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your personal identity, preferred brand presets, and review your historical valuation portfolio.
        </p>
      </div>

      {/* Profile Identity Card */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#2f7bff]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Avatar and Name */}
          <div className="flex items-center space-x-5">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-[#2f7bff] via-[#38bdf8] to-[#ff7a2f] flex items-center justify-center font-tech text-2xl sm:text-3xl font-extrabold text-white shadow-glow">
                {getInitials(profile.fullName)}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-[#0b0f1a] border border-white/15 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h2 className="font-tech text-2xl sm:text-3xl font-bold text-white">
                  {profile.fullName}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#2f7bff]/20 text-[#38bdf8] border border-[#2f7bff]/30">
                  Verified Valuator
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{profile.email}</span>
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {profile.city && (
                  <span className="inline-flex items-center space-x-1 text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    <MapPin className="w-3 h-3 text-[#ff7a2f]" />
                    <span>{profile.city}</span>
                  </span>
                )}
                {profile.phone && (
                  <span className="inline-flex items-center space-x-1 text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    <Phone className="w-3 h-3 text-[#2f7bff]" />
                    <span>{profile.phone}</span>
                  </span>
                )}
                <span className="inline-flex items-center space-x-1 text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  <Car className="w-3 h-3 text-emerald-400" />
                  <span>Fav: {profile.preferredBrand}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          {!isEditing && (
            <button
              onClick={() => {
                setFormData({ ...profile });
                setFormErrors({});
                setIsEditing(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-all shadow-sm self-start md:self-auto"
            >
              <Edit3 className="w-4 h-4 text-[#38bdf8]" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Editable Form Modal / Collapsible Section */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card rounded-3xl border border-[#2f7bff]/30 bg-[#0b0f1a]/95 p-6 sm:p-8 space-y-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-tech text-xl font-bold text-white flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-[#2f7bff]" />
                  <span>Edit Personal Details</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Update your contact details and default brand preference
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g., Alex Walker"
                    className="w-full bg-[#0b0f1a]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#2f7bff]"
                  />
                  {formErrors.fullName && (
                    <p className="text-xs text-rose-400">{formErrors.fullName}</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g., alex@example.com"
                    className="w-full bg-[#0b0f1a]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#2f7bff]"
                  />
                  {formErrors.email && (
                    <p className="text-xs text-rose-400">{formErrors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g., +91 98765 43210"
                    className="w-full bg-[#0b0f1a]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#2f7bff]"
                  />
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    City / Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g., Bangalore, Mumbai, Delhi"
                    className="w-full bg-[#0b0f1a]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#2f7bff]"
                  />
                </div>
              </div>

              {/* Preferred Brand */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Preferred Brand
                </label>
                <select
                  value={formData.preferredBrand}
                  onChange={(e) => setFormData({ ...formData, preferredBrand: e.target.value })}
                  className="w-full bg-[#0b0f1a]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#2f7bff] cursor-pointer"
                >
                  {brands.map((b) => (
                    <option key={b} value={b} className="bg-[#0b0f1a] text-white">
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#2f7bff] to-[#38bdf8] text-white text-xs font-bold shadow-glow hover:scale-[1.02] transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Row Computed from History */}
      <div className="space-y-3">
        <h3 className="font-tech text-lg font-bold text-white flex items-center space-x-2">
          <Activity className="w-4 h-4 text-[#2f7bff]" />
          <span>Appraisal Activity Metrics</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-1">
            <span className="block text-xs font-semibold uppercase text-slate-400">Total Appraisals</span>
            <div className="font-tech text-2xl sm:text-3xl font-extrabold text-white">
              {stats.total}
            </div>
            <p className="text-[11px] text-slate-400">Logged in SQLite database</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-1">
            <span className="block text-xs font-semibold uppercase text-slate-400">Average Valuation</span>
            <div className="font-tech text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#38bdf8]">
              {formatPrice(stats.avgPrice)}
            </div>
            <p className="text-[11px] text-slate-400">Converted in Settings currency</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-1">
            <span className="block text-xs font-semibold uppercase text-slate-400">Top Queried Brand</span>
            <div className="font-tech text-2xl sm:text-3xl font-extrabold text-[#ff7a2f]">
              {stats.topBrand}
            </div>
            <p className="text-[11px] text-slate-400">Most frequent appraisal target</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-1">
            <span className="block text-xs font-semibold uppercase text-slate-400">Last Prediction</span>
            <div className="font-tech text-xl sm:text-2xl font-bold text-emerald-400 truncate">
              {stats.lastDate}
            </div>
            <p className="text-[11px] text-slate-400">Most recent activity</p>
          </div>
        </div>
      </div>

      {/* Recent Predictions (Last 5) */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="font-tech text-xl font-bold text-white flex items-center space-x-2">
              <HistoryIcon className="w-5 h-5 text-[#38bdf8]" />
              <span>Recent Appraisals (Last 5)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Quick glance at your latest vehicle resale predictions
            </p>
          </div>
          <Link
            to="/history"
            className="flex items-center space-x-1.5 text-xs font-semibold text-[#38bdf8] hover:text-white transition-colors"
          >
            <span>View Full History</span>
            <Sparkles className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentPredictions.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Car className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">No recent predictions found.</p>
            <Link
              to="/"
              className="inline-block text-xs font-bold text-[#2f7bff] hover:underline"
            >
              Appraise a car on the Predictor page &rarr;
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentPredictions.map((row) => {
              const d = new Date(row.created_at);
              return (
                <div
                  key={row.id}
                  className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-white/5 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white text-sm">{row.brand}</span>
                      <span className="text-xs text-slate-400 font-normal">({row.year})</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-300 border border-white/10">
                        {row.fuel}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#2f7bff]/10 text-[#38bdf8] border border-[#2f7bff]/20">
                        {row.transmission}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                      <span>{formatDistance(row.km_driven)}</span>
                      <span>•</span>
                      <span>{row.owner}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1 text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right sm:text-right">
                    <div className="font-tech text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#38bdf8]">
                      {formatPrice(row.predicted_price)}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {formatPrice(row.price_low)} – {formatPrice(row.price_high)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons: Go to Settings & Clear Data */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-tech text-lg font-bold text-white">Profile & App Administration</h4>
          <p className="text-xs text-slate-400">
            Configure system themes, currencies, or reset personal cached profile data.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Link
            to="/settings"
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-slate-200 transition-colors"
          >
            <SettingsIcon className="w-4 h-4 text-[#38bdf8]" />
            <span>Go to Settings</span>
          </Link>

          <button
            onClick={() => setConfirmClearModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Profile Data</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-2xl border border-rose-500/30 bg-[#0b0f1a] p-6 max-w-sm w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-tech text-lg font-bold text-white">Reset Profile Data?</h3>
            </div>
            <p className="text-xs text-slate-300">
              This will reset your profile information back to default "Guest User" values. Your saved predictions history in the database will remain unaffected.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmClearModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleClearProfile}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg"
              >
                Yes, Reset Profile
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Profile;
