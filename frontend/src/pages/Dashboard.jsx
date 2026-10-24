import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Sparkles, 
  History as HistoryIcon, 
  TrendingUp, 
  TrendingDown, 
  GitCompare, 
  Car, 
  ShieldCheck, 
  Wrench, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Layers, 
  Activity, 
  Zap, 
  RotateCcw, 
  Award, 
  Plus, 
  Trash2,
  Sliders,
  DollarSign,
  ChevronRight,
  BarChart2,
  SlidersHorizontal,
  Check,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  Cell
} from 'recharts';
import { useSettings } from '../context/SettingsContext';
import api from '../api';
import StatCard from '../components/StatCard';
import Toast from '../components/Toast';
import { CardSkeleton, ChartSkeleton, TableSkeleton } from '../components/Skeleton';

// Safe date parser helper (handles SQLite 'YYYY-MM-DD HH:MM:SS' across all browsers)
const safeDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  const isoStr = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : String(dateStr);
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? new Date() : d;
};

// Safe extras parser
const parseExtras = (extras) => {
  if (!extras) return {};
  if (typeof extras === 'object') return extras;
  try {
    return JSON.parse(extras);
  } catch {
    return {};
  }
};

// Demo sample vehicles for instant preview when history is empty
const DEMO_CAR_A = {
  id: 'demo-1',
  brand: 'Honda',
  year: 2021,
  km_driven: 32000,
  fuel: 'Petrol',
  transmission: 'Manual',
  owner: 'First Owner',
  condition: 'Excellent',
  working_status: 'Fully working',
  accident_history: 'None',
  service_history: 'Full records',
  extras: { ac_working: true, new_tyres: true, insurance_valid: true },
  base_price: 680000,
  predicted_price: 748000,
  price_low: 727200,
  price_high: 768800,
  health_score: 95,
  created_at: new Date().toISOString(),
};

const DEMO_CAR_B = {
  id: 'demo-2',
  brand: 'Hyundai',
  year: 2020,
  km_driven: 48000,
  fuel: 'Diesel',
  transmission: 'Automatic',
  owner: 'First Owner',
  condition: 'Good',
  working_status: 'Fully working',
  accident_history: 'None',
  service_history: 'Partial',
  extras: { ac_working: true, new_tyres: false, insurance_valid: true },
  base_price: 620000,
  predicted_price: 626200,
  price_low: 605400,
  price_high: 647000,
  health_score: 82,
  created_at: new Date(Date.now() - 86400000).toISOString(),
};

export const Dashboard = () => {
  const { formatPrice, formatDistance, kmToDisplayDistance, distanceToKm, settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();

  // Active Tab state with localStorage persistence
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.initialTab || localStorage.getItem('rider_ai_dashboard_tab') || 'recommended';
  });

  useEffect(() => {
    if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab);
      localStorage.setItem('rider_ai_dashboard_tab', location.state.initialTab);
    }
  }, [location.state]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    try {
      localStorage.setItem('rider_ai_dashboard_tab', tabId);
    } catch (e) {
      console.warn(e);
    }
  };

  // Shared Data States
  const [history, setHistory] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  // Active Subject Car (for Recommended & Future Tabs)
  const [activeCar, setActiveCar] = useState(() => {
    return location.state?.car || null;
  });

  // Future Tab Forecast Controls
  const [forecastYears, setForecastYears] = useState(5);
  const [forecastYearlyKm, setForecastYearlyKm] = useState(12000);
  const [forecastScenario, setForecastScenario] = useState('well_maintained'); // 'well_maintained' | 'neglected'
  const [forecastData, setForecastData] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // Recommended Tab Alternatives
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Past Tab Filters
  const [pastBrandFilter, setPastBrandFilter] = useState('All');
  const [pastDateFilter, setPastDateFilter] = useState('all'); // all, 7d, 30d, 6m

  // Compare Tab State (persisted in localStorage)
  const [compareCars, setCompareCars] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('rider_ai_compare_list') || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [compareResult, setCompareResult] = useState(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  // Fetch initial History & Metadata
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [histData, metaData] = await Promise.all([
        api.getHistory({ limit: 200 }).catch(() => []),
        api.getMetadata().catch(() => null),
      ]);
      const validHist = Array.isArray(histData) ? histData : [];
      setHistory(validHist);
      setMetadata(metaData);

      // If activeCar is not set yet, pick first history item
      if (!activeCar && validHist.length > 0) {
        setActiveCar(validHist[0]);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Unable to load valuation records. Please check the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Update activeCar if incoming location.state.car changes
  useEffect(() => {
    if (location.state?.car) {
      setActiveCar(location.state.car);
    }
  }, [location.state]);

  // If history loads and we still have no activeCar, pick history[0]
  useEffect(() => {
    if (!activeCar && history.length > 0) {
      setActiveCar(history[0]);
    }
  }, [history, activeCar]);

  // Load Recommendations for Active Car
  const loadRecommendations = useCallback(async (car) => {
    if (!car) return;
    try {
      setLoadingRecs(true);
      const params = {
        brand: car.brand || 'Maruti',
        year: Number(car.year) || 2020,
        km_driven: Number(car.km_driven) || 45000,
        fuel: car.fuel || 'Petrol',
        transmission: car.transmission || 'Manual',
        owner: car.owner || 'First Owner',
      };
      const data = await api.getRecommendations(params);
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to fetch brand alternatives:', err);
    } finally {
      setLoadingRecs(false);
    }
  }, []);

  useEffect(() => {
    if (activeCar && (activeTab === 'recommended' || activeTab === 'future')) {
      loadRecommendations(activeCar);
    }
  }, [activeCar, activeTab, loadRecommendations]);

  // Load Forecast for Active Car
  const runForecast = useCallback(async (car, years, km, scenario) => {
    if (!car) return;
    try {
      setLoadingForecast(true);
      const payload = {
        brand: car.brand || 'Maruti',
        year: Number(car.year) || 2020,
        km_driven: Number(car.km_driven) || 45000,
        fuel: car.fuel || 'Petrol',
        transmission: car.transmission || 'Manual',
        owner: car.owner || 'First Owner',
        condition: car.condition || 'Good',
        working_status: car.working_status || 'Fully working',
        accident_history: car.accident_history || 'None',
        service_history: car.service_history || 'Partial',
        extras: parseExtras(car.extras),
        years: Number(years) || 5,
        yearly_km: Number(km) || 12000,
        scenario: scenario || 'well_maintained',
      };
      const res = await api.forecast(payload);
      setForecastData(res);
    } catch (err) {
      console.error('Forecast failed:', err);
    } finally {
      setLoadingForecast(false);
    }
  }, []);

  useEffect(() => {
    if (activeCar && (activeTab === 'future' || activeTab === 'recommended')) {
      runForecast(activeCar, forecastYears, forecastYearlyKm, forecastScenario);
    }
  }, [activeCar, forecastYears, forecastYearlyKm, forecastScenario, activeTab, runForecast]);

  // Sync compare cars to localStorage
  const updateCompareCars = (newList) => {
    setCompareCars(newList);
    try {
      localStorage.setItem('rider_ai_compare_list', JSON.stringify(newList));
    } catch (e) {
      console.warn(e);
    }
  };

  // Run Compare when compareCars changes
  const runCompare = useCallback(async (carsList) => {
    if (!carsList || carsList.length < 2) {
      setCompareResult(null);
      return;
    }
    try {
      setLoadingCompare(true);
      const payload = {
        cars: carsList.slice(0, 3).map((c) => ({
          brand: c.brand || 'Maruti',
          year: Number(c.year) || 2020,
          km_driven: Number(c.km_driven) || 45000,
          fuel: c.fuel || 'Petrol',
          transmission: c.transmission || 'Manual',
          owner: c.owner || 'First Owner',
          condition: c.condition || 'Good',
          working_status: c.working_status || 'Fully working',
          accident_history: c.accident_history || 'None',
          service_history: c.service_history || 'Partial',
          extras: parseExtras(c.extras),
        })),
      };
      const res = await api.compare(payload);
      setCompareResult(res);
    } catch (err) {
      console.error('Compare failed:', err);
    } finally {
      setLoadingCompare(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'compare' && compareCars.length >= 2) {
      runCompare(compareCars);
    }
  }, [compareCars, activeTab, runCompare]);

  const handleAddCurrentToCompare = (car) => {
    if (!car) return;
    if (compareCars.length >= 3) {
      setToastType('warning');
      setToastMessage('Comparison limit reached (max 3 cars). Remove one first.');
      return;
    }
    const exists = compareCars.some((c) => c.brand === car.brand && Number(c.year) === Number(car.year) && Number(c.km_driven) === Number(car.km_driven));
    if (exists) {
      setToastType('info');
      setToastMessage(`${car.brand} (${car.year}) is already in your Compare list.`);
      return;
    }
    const updated = [...compareCars, car];
    updateCompareCars(updated);
    setToastType('success');
    setToastMessage(`Added ${car.brand} (${car.year}) to Compare (${updated.length}/3).`);
  };

  const handleRemoveFromCompare = (index) => {
    const updated = compareCars.filter((_, i) => i !== index);
    updateCompareCars(updated);
  };

  // Re-run handler for Past Tab
  const handleRerunCar = (car) => {
    navigate('/', { state: { prefill: car } });
  };

  // Custom Recharts Dark Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card bg-[#0b0f1a]/95 border border-white/15 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 z-50 pointer-events-none">
          {label !== undefined && (
            <p className="font-semibold text-slate-300 border-b border-white/10 pb-1">
              {label}
            </p>
          )}
          {payload.map((entry, index) => {
            const isPriceField = entry.name && (
              entry.name.toLowerCase().includes('price') ||
              entry.name.toLowerCase().includes('value') ||
              entry.name.toLowerCase().includes('bound') ||
              entry.name.toLowerCase().includes('estimate')
            );

            return (
              <div key={index} className="flex items-center space-x-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color || entry.fill || entry.stroke || '#2f7bff' }}
                />
                <span className="text-slate-400">{entry.name}:</span>
                <span className="font-semibold text-white">
                  {typeof entry.value === 'number' && isPriceField
                    ? formatPrice(entry.value)
                    : typeof entry.value === 'number'
                    ? entry.value.toLocaleString()
                    : entry.value}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Health Score Style
  const getHealthColor = (score) => {
    const s = Number(score) || 75;
    if (s >= 75) return { stroke: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    if (s >= 50) return { stroke: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    return { stroke: '#ef4444', text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
  };

  // Past Tab Filtered Data
  const filteredPastHistory = useMemo(() => {
    return history.filter((item) => {
      if (pastBrandFilter !== 'All' && item.brand !== pastBrandFilter) return false;

      if (pastDateFilter !== 'all') {
        const itemDate = safeDate(item.created_at).getTime();
        const now = Date.now();
        const diffDays = (now - itemDate) / (1000 * 3600 * 24);
        if (pastDateFilter === '7d' && diffDays > 7) return false;
        if (pastDateFilter === '30d' && diffDays > 30) return false;
        if (pastDateFilter === '6m' && diffDays > 180) return false;
      }
      return true;
    });
  }, [history, pastBrandFilter, pastDateFilter]);

  // Past Tab Aggregates
  const pastAggregates = useMemo(() => {
    if (!filteredPastHistory.length) return { total: 0, avg: 0, max: 0, min: 0 };
    const prices = filteredPastHistory.map((h) => Number(h.predicted_price) || 0).filter((p) => p > 0);
    const total = filteredPastHistory.length;
    const avg = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    const min = prices.length ? Math.min(...prices) : 0;
    return { total, avg, max, min };
  }, [filteredPastHistory]);

  // Past Tab Timeline Chart Data
  const pastTimelineData = useMemo(() => {
    return [...filteredPastHistory]
      .sort((a, b) => safeDate(a.created_at) - safeDate(b.created_at))
      .map((item) => {
        const d = safeDate(item.created_at);
        const dateLabel = `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
        return {
          date: dateLabel,
          price: Math.round(Number(item.predicted_price) || 0),
          brand: item.brand,
        };
      });
  }, [filteredPastHistory]);

  // Past Tab Brand Chart Data
  const pastBrandData = useMemo(() => {
    const counts = {};
    filteredPastHistory.forEach((h) => {
      const b = h.brand || 'Other';
      counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([brand, count]) => ({ brand, count: Number(count) }))
      .sort((a, b) => b.count - a.count);
  }, [filteredPastHistory]);

  // Tab Navigation Definitions
  const tabs = [
    { id: 'recommended', label: 'Recommended', icon: Sparkles, desc: 'Optimisation Advice & Alternatives' },
    { id: 'past', label: 'Past Valuations', icon: HistoryIcon, desc: 'Historical Appraisals & Trends' },
    { id: 'future', label: 'Future Forecast', icon: TrendingUp, desc: 'Depreciation Trajectory' },
    { id: 'compare', label: 'Compare Cars', icon: GitCompare, desc: 'Side-by-Side Evaluation' },
  ];

  // List of available cars for switching in dropdowns
  const availableCars = useMemo(() => {
    const list = [...history];
    if (activeCar && !list.some((h) => h.id === activeCar.id)) {
      list.unshift(activeCar);
    }
    return list;
  }, [history, activeCar]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#2f7bff]/15 text-[#38bdf8] border border-[#2f7bff]/30 mb-2">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Automotive Intelligence Dashboard</span>
          </div>
          <h1 className="font-tech text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Valuation Intelligence Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Forecast depreciation trajectories, benchmark alternative brands, explore appraisal history, and compare vehicles side-by-side.
          </p>
        </div>

        <button
          onClick={fetchInitialData}
          disabled={loading}
          className="self-start sm:self-center flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
          title="Refresh dashboard data"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#38bdf8] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="glass-card rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-rose-300">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div>
              <h4 className="font-semibold text-rose-200">Failed to load data</h4>
              <p className="text-xs text-rose-300/80">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchInitialData}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Animated 4-Tab Navigation Bar */}
      <div className="glass-card p-1.5 rounded-2xl border border-white/10 flex flex-wrap sm:flex-nowrap gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                isActive
                  ? 'text-white shadow-glow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#38bdf8]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeDashboardTab"
                  className="absolute inset-0 bg-gradient-to-r from-[#2f7bff]/30 to-[#38bdf8]/20 border border-[#2f7bff]/50 rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RECOMMENDED                                                        */}
      {/* ========================================================================= */}
      {activeTab === 'recommended' && (
        <div className="space-y-6">
          {/* Active Car Selector Dropdown */}
          {availableCars.length > 0 && activeCar && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-card p-4 rounded-2xl border border-white/10">
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <Car className="w-4 h-4 text-[#2f7bff]" />
                <span className="font-semibold text-white">Advisory Subject Vehicle:</span>
              </div>
              <select
                value={activeCar.id || ''}
                onChange={(e) => {
                  const found = availableCars.find((c) => String(c.id) === e.target.value);
                  if (found) setActiveCar(found);
                }}
                className="bg-[#0b0f1a]/80 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#2f7bff] cursor-pointer"
              >
                {availableCars.map((item, idx) => (
                  <option key={item.id || idx} value={item.id || ''} className="bg-[#0b0f1a] text-white">
                    {item.brand} ({item.year}) • {formatDistance(item.km_driven)} • {formatPrice(item.predicted_price)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!activeCar ? (
            /* Empty State */
            <div className="glass-card rounded-3xl border border-white/10 p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-[#38bdf8]">
                <Sparkles className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="font-tech text-xl font-bold text-white">No Vehicles Evaluated Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Run a valuation on the Predictor page or load a sample vehicle to unlock optimal liquidation timing and high-retention brand alternatives.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2f7bff] to-[#ff7a2f] text-white font-medium text-xs sm:text-sm shadow-glow"
                >
                  <Car className="w-4 h-4" />
                  <span>Appraise a Car Now</span>
                </Link>
                <button
                  onClick={() => setActiveCar(DEMO_CAR_A)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs sm:text-sm font-semibold text-slate-200 transition-colors"
                >
                  Load Sample Car (Honda 2021)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Row: Best Time to Sell & Boost Your Price */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Best Time to Sell Card */}
                <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 space-y-4 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-[#38bdf8]" />
                        <h3 className="font-tech text-lg font-bold text-white">Best Time to Sell</h3>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        24-Month Strategy
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#2f7bff]/10 border border-[#2f7bff]/20 space-y-1">
                      <span className="text-xs uppercase font-bold text-[#38bdf8] tracking-wider block">
                        Optimal Liquidation Window
                      </span>
                      <p className="font-tech text-2xl font-bold text-white">
                        Sell within the next 6 months
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed pt-1">
                        Based on the {activeCar.brand} ({activeCar.year}) age curve, waiting 12 months will reduce expected resale value by approximately{' '}
                        <strong className="text-amber-400">
                          {forecastData?.forecast?.[1]
                            ? `${Math.round(((activeCar.predicted_price - forecastData.forecast[1].adjusted_price) / (activeCar.predicted_price || 1)) * 1000) / 10}% (${formatPrice(activeCar.predicted_price - forecastData.forecast[1].adjusted_price)})`
                            : `7.5% (${formatPrice((activeCar.predicted_price || 500000) * 0.075)})`}
                        </strong>{' '}
                        due to compounding odometer wear and aging.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="block text-[10px] uppercase text-slate-400">Current Valuation</span>
                        <span className="font-tech text-lg font-bold text-white">
                          {formatPrice(activeCar.predicted_price || 500000)}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="block text-[10px] uppercase text-slate-400">Projected in 12 Months</span>
                        <span className="font-tech text-lg font-bold text-amber-400">
                          {formatPrice(
                            forecastData?.forecast?.[1]?.adjusted_price ||
                            (activeCar.predicted_price ? activeCar.predicted_price * 0.925 : 462500)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTabChange('future')}
                    className="mt-4 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    <span>View Year-by-Year Depreciation Forecast</span>
                    <ChevronRight className="w-4 h-4 text-[#38bdf8]" />
                  </button>
                </div>

                {/* 2. Boost Your Price Card */}
                <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center space-x-2">
                        <Wrench className="w-5 h-5 text-[#ff7a2f]" />
                        <h3 className="font-tech text-lg font-bold text-white">Boost Your Resale Value</h3>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                        Actionable Fixes
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">
                      Concrete steps to repair or document this car to command higher buyer offers:
                    </p>

                    <div className="space-y-2">
                      {/* Minor issues fix */}
                      {activeCar.working_status !== 'Fully working' ? (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-white block">Rectify Operational Glitches</span>
                            <span className="text-[11px] text-slate-400">Upgrade status from '{activeCar.working_status}' to 'Fully working'</span>
                          </div>
                          <span className="font-tech font-bold text-emerald-400">
                            +{formatPrice((activeCar.base_price || 500000) * 0.05)}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 text-emerald-300">
                            <Check className="w-4 h-4" />
                            <span>Mechanical status is optimal (Fully working)</span>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-400">Max Value</span>
                        </div>
                      )}

                      {/* Full service records */}
                      {activeCar.service_history !== 'Full records' ? (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-white block">Consolidate Authorized Service Records</span>
                            <span className="text-[11px] text-slate-400">Increases buyer trust with full historical logbooks</span>
                          </div>
                          <span className="font-tech font-bold text-emerald-400">
                            +{formatPrice((activeCar.base_price || 500000) * 0.03)}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 text-emerald-300">
                            <Check className="w-4 h-4" />
                            <span>Full authorized service records verified</span>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-400">+3% Added</span>
                        </div>
                      )}

                      {/* Tyres */}
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-white block">Fit Fresh / Brand-New Tyres</span>
                          <span className="text-[11px] text-slate-400">Immediate visual curb-appeal and road-worthiness</span>
                        </div>
                        <span className="font-tech font-bold text-emerald-400">
                          +{formatPrice((activeCar.base_price || 500000) * 0.02)}
                        </span>
                      </div>

                      {/* Insurance renewal */}
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-white block">Renew Valid Comprehensive Insurance</span>
                          <span className="text-[11px] text-slate-400">Smooth RC transfer without immediate policy expenditure</span>
                        </div>
                        <span className="font-tech font-bold text-emerald-400">
                          +{formatPrice((activeCar.base_price || 500000) * 0.01)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 pt-2 border-t border-white/5">
                    * Estimated uplift based on RIDER_AI condition adjustment coefficients.
                  </p>
                </div>
              </div>

              {/* 3. Better-Value Alternatives (GET /recommendations) */}
              <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="font-tech text-xl font-bold text-white flex items-center space-x-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <span>Better-Value Alternatives</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Top alternative marques with superior 3-year resale value retention at the same age ({2026 - activeCar.year}y) and mileage ({formatDistance(activeCar.km_driven)})
                    </p>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    3-Year Retention Benchmark
                  </span>
                </div>

                {loadingRecs ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <CardSkeleton key={i} />
                    ))}
                  </div>
                ) : recommendations.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No alternative brand recommendations available.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {recommendations.map((rec) => (
                      <div
                        key={rec.brand}
                        className="glass-card p-5 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between hover:border-[#2f7bff]/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-block mb-1">
                            {rec.badge}
                          </span>
                          <h4 className="font-tech text-lg font-bold text-white">{rec.brand}</h4>
                          <span className="text-xs text-slate-400 block">Est. Market Value</span>
                          <div className="font-tech text-base font-bold text-[#38bdf8]">
                            {formatPrice(rec.current_price)}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/5 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">3-Yr Retention:</span>
                            <span className="font-bold text-emerald-400 font-mono">{rec.retention_percent}%</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Value @ +3y:</span>
                            <span className="font-mono text-slate-300">{formatPrice(rec.three_year_price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAST (History & User Input Analytics)                              */}
      {/* ========================================================================= */}
      {activeTab === 'past' && (
        <div className="space-y-8">
          {/* Controls & Filter Bar */}
          <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Brand Filter */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Brand:</span>
                <select
                  value={pastBrandFilter}
                  onChange={(e) => setPastBrandFilter(e.target.value)}
                  className="bg-[#0b0f1a]/80 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#2f7bff] cursor-pointer"
                >
                  <option value="All">All Brands</option>
                  {metadata?.brands?.map((b) => (
                    <option key={b} value={b} className="bg-[#0b0f1a] text-white">
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Timeframe:</span>
                <select
                  value={pastDateFilter}
                  onChange={(e) => setPastDateFilter(e.target.value)}
                  className="bg-[#0b0f1a]/80 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#2f7bff] cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="6m">Last 6 Months</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Showing {filteredPastHistory.length} of {history.length} records
            </div>
          </div>

          {filteredPastHistory.length === 0 ? (
            /* Empty State */
            <div className="glass-card rounded-3xl border border-white/10 p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-[#38bdf8]">
                <HistoryIcon className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="font-tech text-xl font-bold text-white">No Matching Appraisals</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  No historical records match your filter criteria. Try resetting the filters or run a new valuation on the Predictor page.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setPastBrandFilter('All');
                    setPastDateFilter('all');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs sm:text-sm font-semibold text-slate-200 transition-colors"
                >
                  Reset Filters
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2f7bff] to-[#ff7a2f] text-white font-medium text-xs sm:text-sm shadow-glow"
                >
                  <span>Run New Valuation</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Aggregated Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Filtered Appraisals"
                  value={pastAggregates.total}
                  decimals={0}
                  subtitle="Vehicles evaluated"
                  icon={Car}
                  color="blue"
                />

                <StatCard
                  title="Average Resale Price"
                  value={formatPrice(pastAggregates.avg)}
                  isNumeric={false}
                  subtitle="Mean of queried vehicles"
                  icon={Activity}
                  color="orange"
                />

                <StatCard
                  title="Highest Valuation"
                  value={formatPrice(pastAggregates.max)}
                  isNumeric={false}
                  subtitle="Top appraisal value"
                  icon={TrendingUp}
                  color="emerald"
                />

                <StatCard
                  title="Lowest Valuation"
                  value={formatPrice(pastAggregates.min)}
                  isNumeric={false}
                  subtitle="Minimum appraisal value"
                  icon={TrendingDown}
                  color="purple"
                />
              </div>

              {/* Charts: Valuation Over Time & Breakdown by Brand */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Timeline Chart */}
                <div className="glass-card rounded-3xl border border-white/10 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="font-tech text-lg font-bold text-white flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-[#38bdf8]" />
                      <span>Valuations Over Time</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                      Chronological
                    </span>
                  </div>
                  <div className="w-full pt-2">
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={pastTimelineData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#94a3b8" tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="price"
                          name="Predicted Resale Price"
                          stroke="#38bdf8"
                          strokeWidth={3}
                          dot={{ fill: '#38bdf8', r: 4 }}
                          activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Brand Frequency Bar Chart */}
                <div className="glass-card rounded-3xl border border-white/10 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="font-tech text-lg font-bold text-white flex items-center space-x-2">
                      <Car className="w-4 h-4 text-[#ff7a2f]" />
                      <span>Appraisals by Brand</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                      Frequency
                    </span>
                  </div>
                  <div className="w-full pt-2">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={pastBrandData} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="brand" stroke="#94a3b8" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                        <YAxis stroke="#94a3b8" allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Evaluations Count" fill="#ff7a2f" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Enhanced Past Predictions Table */}
              <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="font-tech text-xl font-bold text-white">Detailed Past Valuations</h3>
                    <p className="text-xs text-slate-400">
                      Includes mechanical condition, working status, and health scores
                    </p>
                  </div>
                  <Link
                    to="/history"
                    className="text-xs font-semibold text-[#38bdf8] hover:text-white transition-colors"
                  >
                    View in History &rarr;
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-semibold tracking-wider uppercase text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Vehicle Specs</th>
                        <th className="py-3 px-4">Condition</th>
                        <th className="py-3 px-4">Working Status</th>
                        <th className="py-3 px-4">Health</th>
                        <th className="py-3 px-4">Adjusted Valuation</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {filteredPastHistory.map((row) => {
                        const d = safeDate(row.created_at);
                        const hScore = Number(row.health_score) || 80;
                        const hStyle = getHealthColor(hScore);

                        return (
                          <tr key={row.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-400">
                              {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-white block">{row.brand} ({row.year})</span>
                              <span className="text-[11px] text-slate-400">{formatDistance(row.km_driven)} • {row.fuel}</span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/5 text-slate-300 border border-white/10">
                                {row.condition || 'Good'}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-300">
                              {row.working_status || 'Fully working'}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${hStyle.bg} ${hStyle.text}`}>
                                {hScore}/100
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="font-tech font-bold text-white text-base">
                                {formatPrice(row.predicted_price)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleRerunCar(row)}
                                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-200 font-medium transition-colors"
                                  title="Re-run this car on Predictor"
                                >
                                  Re-run
                                </button>
                                <button
                                  onClick={() => handleAddCurrentToCompare(row)}
                                  className="px-2.5 py-1 rounded-lg bg-[#2f7bff]/20 hover:bg-[#2f7bff]/30 text-xs text-[#38bdf8] font-medium transition-colors"
                                  title="Add this car to Compare tab"
                                >
                                  + Compare
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FUTURE (Value Forecast)                                            */}
      {/* ========================================================================= */}
      {activeTab === 'future' && (
        <div className="space-y-6">
          {/* Active Car Selector Dropdown */}
          {availableCars.length > 0 && activeCar && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-card p-4 rounded-2xl border border-white/10">
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <Car className="w-4 h-4 text-[#ff7a2f]" />
                <span className="font-semibold text-white">Car Under Projection:</span>
              </div>
              <select
                value={activeCar.id || ''}
                onChange={(e) => {
                  const found = availableCars.find((c) => String(c.id) === e.target.value);
                  if (found) setActiveCar(found);
                }}
                className="bg-[#0b0f1a]/80 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#2f7bff] cursor-pointer"
              >
                {availableCars.map((item, idx) => (
                  <option key={item.id || idx} value={item.id || ''} className="bg-[#0b0f1a] text-white">
                    {item.brand} ({item.year}) • {formatDistance(item.km_driven)} • {formatPrice(item.predicted_price)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!activeCar ? (
            <div className="glass-card rounded-3xl border border-white/10 p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-[#ff7a2f]">
                <TrendingUp className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="font-tech text-xl font-bold text-white">No Vehicle Selected for Forecast</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Run a prediction on the Predictor page or load a sample vehicle to project its future resale values and depreciation bands.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2f7bff] to-[#ff7a2f] text-white font-medium text-xs sm:text-sm shadow-glow"
                >
                  <span>Predict a Car</span>
                </Link>
                <button
                  onClick={() => setActiveCar(DEMO_CAR_A)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs sm:text-sm font-semibold text-slate-200 transition-colors"
                >
                  Load Sample Car (Honda 2021)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Forecast Controls Panel */}
              <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="font-tech text-lg font-bold text-white flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-[#ff7a2f]" />
                    <span>Forecast Simulation Parameters</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    Subject: <strong className="text-white">{activeCar.brand} ({activeCar.year})</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Years to forecast slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold uppercase">Horizon:</span>
                      <span className="font-tech text-sm font-bold text-[#38bdf8]">{forecastYears} Years</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={forecastYears}
                      onChange={(e) => setForecastYears(Number(e.target.value))}
                      className="w-full accent-[#38bdf8]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>1 yr</span>
                      <span>10 yrs</span>
                    </div>
                  </div>

                  {/* Expected yearly km slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold uppercase">Annual Mileage:</span>
                      <span className="font-tech text-sm font-bold text-[#ff7a2f]">{formatDistance(forecastYearlyKm)} / yr</span>
                    </div>
                    <input
                      type="range"
                      min="3000"
                      max="35000"
                      step="1000"
                      value={forecastYearlyKm}
                      onChange={(e) => setForecastYearlyKm(Number(e.target.value))}
                      className="w-full accent-[#ff7a2f]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>3,000 km</span>
                      <span>35,000 km</span>
                    </div>
                  </div>

                  {/* Scenario Toggle */}
                  <div className="space-y-2">
                    <span className="block text-xs text-slate-300 font-semibold uppercase">Maintenance Scenario:</span>
                    <div className="grid grid-cols-2 gap-1.5 bg-[#0b0f1a]/80 p-1.5 rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setForecastScenario('well_maintained')}
                        className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          forecastScenario === 'well_maintained'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Well Maintained
                      </button>
                      <button
                        type="button"
                        onClick={() => setForecastScenario('neglected')}
                        className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          forecastScenario === 'neglected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Neglected
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Future Stat Cards */}
              {loadingForecast && !forecastData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : forecastData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Value in 1 Year"
                    value={formatPrice(forecastData.forecast[1]?.adjusted_price || forecastData.forecast[0]?.adjusted_price || 0)}
                    isNumeric={false}
                    subtitle={`Retention: ${Math.round(((forecastData.forecast[1]?.adjusted_price || forecastData.forecast[0]?.adjusted_price || 1) / (forecastData.forecast[0]?.adjusted_price || 1)) * 100)}%`}
                    icon={Calendar}
                    color="blue"
                  />

                  <StatCard
                    title="Value in 3 Years"
                    value={formatPrice(forecastData.forecast[3]?.adjusted_price || forecastData.forecast[forecastData.forecast.length - 1]?.adjusted_price || 0)}
                    isNumeric={false}
                    subtitle={forecastData.forecast[3] ? "Mid-term 3-yr projection" : `Horizon (${forecastYears} yr)`}
                    icon={TrendingDown}
                    color="orange"
                  />

                  <StatCard
                    title={`Value in ${forecastYears} Years`}
                    value={formatPrice(forecastData.forecast[forecastData.forecast.length - 1]?.adjusted_price || 0)}
                    isNumeric={false}
                    subtitle="Long-term valuation"
                    icon={Layers}
                    color="purple"
                  />

                  <StatCard
                    title="Total Depreciation"
                    value={`${forecastData.depreciation_percent}%`}
                    isNumeric={false}
                    subtitle={`Retains ${forecastData.value_retained_percent}%`}
                    icon={Activity}
                    color="emerald"
                  />
                </div>
              ) : null}

              {/* Shaded Range Forecast Chart using ComposedChart */}
              <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 space-y-4 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="font-tech text-xl font-bold text-white flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-[#38bdf8]" />
                      <span>Projected Resale Price Range Band</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Shaded area represents MAE confidence bounds; centre line is expected adjusted value
                    </p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Scenario: {forecastScenario === 'well_maintained' ? 'Well Maintained (0.5%/yr wear)' : 'Neglected (1.5%/yr wear)'}
                  </span>
                </div>

                {loadingForecast || !forecastData ? (
                  <ChartSkeleton />
                ) : (
                  <div className="w-full pt-2">
                    <ResponsiveContainer width="100%" height={320}>
                      <ComposedChart
                        data={forecastData.forecast.map((f) => ({
                          yearLabel: `Yr +${f.year_index} (${f.future_year})`,
                          price: f.adjusted_price,
                          priceLow: f.price_low,
                          priceHigh: f.price_high,
                          km: f.km_driven,
                        }))}
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <defs>
                          <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2f7bff" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#2f7bff" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="yearLabel" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#94a3b8" tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Area
                          type="monotone"
                          dataKey="priceHigh"
                          stroke="#2f7bff"
                          strokeOpacity={0.4}
                          strokeDasharray="4 4"
                          fill="url(#forecastAreaGrad)"
                          name="Upper Bound (High)"
                        />
                        <Area
                          type="monotone"
                          dataKey="priceLow"
                          stroke="#2f7bff"
                          strokeOpacity={0.3}
                          strokeDasharray="4 4"
                          fill="transparent"
                          name="Lower Bound (Low)"
                        />
                        <Line
                          type="monotone"
                          dataKey="price"
                          name="Expected Resale Price"
                          stroke="#ff7a2f"
                          strokeWidth={3}
                          dot={{ fill: '#ff7a2f', r: 5 }}
                          activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Forecast Table by Year */}
              {forecastData && (
                <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 space-y-4">
                  <h3 className="font-tech text-lg font-bold text-white">Year-by-Year Valuation Schedule</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-semibold tracking-wider uppercase text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Timeline</th>
                          <th className="py-3 px-4">Calendar Year</th>
                          <th className="py-3 px-4">Vehicle Age</th>
                          <th className="py-3 px-4">Cumulative Mileage</th>
                          <th className="py-3 px-4">Estimated Value</th>
                          <th className="py-3 px-4">Likely Range</th>
                          <th className="py-3 px-4 text-right">Retention</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-200">
                        {forecastData.forecast.map((f) => {
                          const initialP = forecastData.forecast[0]?.adjusted_price || 1;
                          const retPct = Math.round((f.adjusted_price / initialP) * 100);
                          return (
                            <tr key={f.year_index} className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 font-bold text-white">
                                {f.year_index === 0 ? 'Today (Now)' : `Year +${f.year_index}`}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-300">{f.future_year}</td>
                              <td className="py-3 px-4 text-slate-300">{f.car_age} yrs</td>
                              <td className="py-3 px-4 font-mono text-slate-300">{formatDistance(f.km_driven)}</td>
                              <td className="py-3 px-4 font-tech font-bold text-[#38bdf8] text-base">
                                {formatPrice(f.adjusted_price)}
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-400">
                                {formatPrice(f.price_low)} – {formatPrice(f.price_high)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                                {retPct}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Mandatory Disclaimer Label */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-400 text-center">
                Forecast is an estimate based on the trained model and assumptions. It is not a market guarantee.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COMPARE (Side-by-Side Evaluation)                                  */}
      {/* ========================================================================= */}
      {activeTab === 'compare' && (
        <div className="space-y-8">
          {/* Compare Header & Quick Add */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-tech text-xl font-bold text-white flex items-center space-x-2">
                <GitCompare className="w-5 h-5 text-[#2f7bff]" />
                <span>Side-by-Side Vehicle Comparison</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Benchmark 2 to 3 vehicles across price, mechanical health, and 3-year resale retention
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Quick Add from History Dropdown */}
              {history.length > 0 && compareCars.length < 3 && (
                <select
                  value=""
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    if (idx >= 0 && history[idx]) {
                      handleAddCurrentToCompare(history[idx]);
                    }
                  }}
                  className="bg-[#0b0f1a]/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2f7bff] cursor-pointer"
                >
                  <option value="" disabled>+ Add vehicle from History...</option>
                  {history.map((h, i) => (
                    <option key={h.id || i} value={i} className="bg-[#0b0f1a] text-white">
                      {h.brand} ({h.year}) - {formatPrice(h.predicted_price)}
                    </option>
                  ))}
                </select>
              )}

              {compareCars.length > 0 && (
                <button
                  onClick={() => updateCompareCars([])}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-xs text-slate-400 hover:text-rose-400 border border-white/10 transition-colors"
                >
                  Clear List
                </button>
              )}
            </div>
          </div>

          {compareCars.length < 2 ? (
            /* Empty State */
            <div className="glass-card rounded-3xl border border-white/10 p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-[#2f7bff]">
                <GitCompare className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="font-tech text-xl font-bold text-white">Need At Least 2 Vehicles to Compare</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Add cars from your appraisal history, load the sample comparison demo, or use the Predictor page's "Add to Compare" button.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => {
                    updateCompareCars([DEMO_CAR_A, DEMO_CAR_B]);
                  }}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2f7bff] to-[#ff7a2f] text-white font-medium text-xs sm:text-sm shadow-glow"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Load Sample Comparison Demo</span>
                </button>
                {history.length >= 2 && (
                  <button
                    onClick={() => {
                      updateCompareCars(history.slice(0, 2));
                    }}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs sm:text-sm font-semibold text-slate-200 transition-colors"
                  >
                    Compare Latest 2 from History
                  </button>
                )}
                <Link
                  to="/"
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs sm:text-sm font-semibold text-slate-300 transition-colors"
                >
                  Appraise New Car
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Winner Verdict Banner */}
              {loadingCompare && !compareResult ? (
                <CardSkeleton />
              ) : compareResult ? (
                <div className="glass-card rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-3">
                  <div className="flex items-center space-x-2.5 text-amber-300">
                    <Award className="w-6 h-6" />
                    <h4 className="font-tech text-lg font-bold">Category Champions Verdict</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    {compareResult.verdict}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white/10 text-white font-semibold border border-white/10">
                      💰 Top Price: <span className="text-[#38bdf8]">{compareResult.winner_price}</span>
                    </span>
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white/10 text-white font-semibold border border-white/10">
                      🛡️ Best Health: <span className="text-emerald-400">{compareResult.winner_health}</span>
                    </span>
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white/10 text-white font-semibold border border-white/10">
                      📈 Best Retention: <span className="text-[#ff7a2f]">{compareResult.winner_retention}</span>
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Side-by-Side Cards Grid */}
              {compareResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {compareResult.cars.map((car, idx) => {
                    const hStyle = getHealthColor(car.health_score);
                    const maxPrice = Math.max(...compareResult.cars.map((c) => c.predicted_price));
                    const maxHealth = Math.max(...compareResult.cars.map((c) => c.health_score));
                    const maxRetention = Math.max(...compareResult.cars.map((c) => c.value_retained_percent));

                    const isPriceWinner = car.predicted_price === maxPrice;
                    const isHealthWinner = car.health_score === maxHealth;
                    const isRetentionWinner = car.value_retained_percent === maxRetention;

                    return (
                      <div
                        key={idx}
                        className="glass-card rounded-3xl border border-white/10 p-6 space-y-5 flex flex-col justify-between relative group hover:border-[#2f7bff]/40 transition-colors shadow-2xl"
                      >
                        {/* Remove from compare button */}
                        <button
                          onClick={() => handleRemoveFromCompare(idx)}
                          className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Remove car from comparison"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-4">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                              Car Option 0{idx + 1}
                            </span>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-tech text-2xl font-bold text-white">
                                {car.brand}
                              </h4>
                              <span className="text-xs text-slate-400 font-normal">({car.year})</span>
                            </div>
                            <span className="text-xs text-slate-400">
                              {formatDistance(car.km_driven)} • {car.fuel} • {car.transmission}
                            </span>
                          </div>

                          {/* Winner Badges */}
                          <div className="flex flex-wrap gap-1.5">
                            {isPriceWinner && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                                🏆 Top Valuation
                              </span>
                            )}
                            {isHealthWinner && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                                🛡️ Health Champion
                              </span>
                            )}
                            {isRetentionWinner && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                📈 Highest Retention
                              </span>
                            )}
                          </div>

                          {/* Key Metrics Grid */}
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Adjusted Valuation:</span>
                              <span className="font-tech text-lg font-bold text-[#38bdf8]">
                                {formatPrice(car.predicted_price)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Likely Range:</span>
                              <span className="text-slate-300">
                                {formatPrice(car.price_low)} – {formatPrice(car.price_high)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Health Score:</span>
                              <span className={`font-bold font-mono px-2 py-0.5 rounded ${hStyle.bg} ${hStyle.text}`}>
                                {car.health_score}/100
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Condition / Status:</span>
                              <span className="text-slate-200">{car.condition} • {car.working_status}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-white/5 pt-2">
                              <span className="text-slate-400">Value in 3 Years:</span>
                              <span className="font-tech font-bold text-white">{formatPrice(car.three_year_price)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">3-Yr Retention:</span>
                              <span className="font-mono font-bold text-emerald-400">{car.value_retained_percent}%</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRerunCar(car)}
                          className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-colors"
                        >
                          Open in Predictor
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Charts: Grouped Bar & Radar Chart */}
              {compareResult && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Grouped Bar Chart: Price Now vs in 3 Years */}
                  <div className="glass-card rounded-3xl border border-white/10 p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <h3 className="font-tech text-lg font-bold text-white flex items-center space-x-2">
                        <BarChart2 className="w-4 h-4 text-[#2f7bff]" />
                        <span>Current Value vs 3-Year Projection</span>
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                        Grouped Bar
                      </span>
                    </div>

                    <div className="w-full pt-2">
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                          data={compareResult.cars.map((c) => ({
                            name: `${c.brand} (${c.year})`,
                            'Current Price': c.predicted_price,
                            '3-Year Value': c.three_year_price,
                          }))}
                          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                          <YAxis stroke="#94a3b8" tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} tick={{ fontSize: 11 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="Current Price" fill="#2f7bff" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="3-Year Value" fill="#ff7a2f" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Multi-Dimensional Radar Chart */}
                  <div className="glass-card rounded-3xl border border-white/10 p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <h3 className="font-tech text-lg font-bold text-white flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span>Multi-Dimensional Vehicle Benchmark</span>
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                        Radar (0–100)
                      </span>
                    </div>

                    <div className="w-full pt-2">
                      <ResponsiveContainer width="100%" height={320}>
                        <RadarChart
                          cx="50%"
                          cy="50%"
                          outerRadius="75%"
                          data={[
                            {
                              subject: 'Market Price',
                              ...Object.fromEntries(
                                compareResult.cars.map((c, i) => [
                                  `car_${i}`,
                                  Math.min(100, Math.round((c.predicted_price / 1500000) * 100)),
                                ])
                              ),
                            },
                            {
                              subject: 'Health Score',
                              ...Object.fromEntries(
                                compareResult.cars.map((c, i) => [`car_${i}`, c.health_score])
                              ),
                            },
                            {
                              subject: '3-Yr Retention',
                              ...Object.fromEntries(
                                compareResult.cars.map((c, i) => [`car_${i}`, Math.min(100, Math.round(c.value_retained_percent))])
                              ),
                            },
                            {
                              subject: 'Low Mileage',
                              ...Object.fromEntries(
                                compareResult.cars.map((c, i) => [
                                  `car_${i}`,
                                  Math.max(10, Math.round(100 - (c.km_driven / 200000) * 100)),
                                ])
                              ),
                            },
                            {
                              subject: 'Modern Age',
                              ...Object.fromEntries(
                                compareResult.cars.map((c, i) => [
                                  `car_${i}`,
                                  Math.max(10, Math.round(100 - (c.car_age / 20) * 100)),
                                ])
                              ),
                            },
                          ]}
                        >
                          <PolarGrid stroke="rgba(255,255,255,0.15)" />
                          <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 9 }} />
                          {compareResult.cars.map((c, i) => {
                            const colors = ['#2f7bff', '#ff7a2f', '#10b981'];
                            return (
                              <Radar
                                key={i}
                                name={`${c.brand} (${c.year})`}
                                dataKey={`car_${i}`}
                                stroke={colors[i % colors.length]}
                                fill={colors[i % colors.length]}
                                fillOpacity={0.25}
                              />
                            );
                          })}
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Tooltip content={<CustomTooltip />} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;