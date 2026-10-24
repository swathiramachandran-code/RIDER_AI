import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  RotateCcw, 
  BookmarkCheck, 
  AlertCircle, 
  Fuel, 
  SlidersHorizontal, 
  Calendar, 
  Activity, 
  Check, 
  RefreshCw,
  Zap,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Wrench,
  AlertTriangle,
  FileText,
  CheckSquare,
  PlusCircle,
  BarChart2,
  GitCompare,
  TrendingDown as TrendDownIcon
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import api from '../api';
import CarHero from '../components/CarHero';
import Gauge from '../components/Gauge';
import Toast from '../components/Toast';

export const Predictor = () => {
  const { 
    settings, 
    formatPrice, 
    formatDistance, 
    distanceToKm, 
    kmToDisplayDistance 
  } = useSettings();

  const location = useLocation();
  const navigate = useNavigate();

  // Metadata from backend
  const [metadata, setMetadata] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [serverError, setServerError] = useState(false);

  // Form State (Core ML features)
  const [brand, setBrand] = useState('');
  const [year, setYear] = useState(2020);
  const [kmDriven, setKmDriven] = useState(45000);
  const [fuel, setFuel] = useState('Petrol');
  const [transmission, setTransmission] = useState('Manual');
  const [owner, setOwner] = useState('First Owner');

  // Extended Condition & Working Status State
  const [condition, setCondition] = useState('Good');
  const [workingStatus, setWorkingStatus] = useState('Fully working');
  const [accidentHistory, setAccidentHistory] = useState('None');
  const [serviceHistory, setServiceHistory] = useState('Partial');
  const [extras, setExtras] = useState({
    ac_working: false,
    new_tyres: false,
    insurance_valid: false,
  });

  // UI / Prediction State
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const fetchMeta = async () => {
    try {
      setLoadingMeta(true);
      setServerError(false);
      const data = await api.getMetadata();
      setMetadata(data);

      // Check if location state has pre-fill data (e.g. from Dashboard "Re-run")
      const prefill = location.state?.prefill;
      if (prefill) {
        if (prefill.brand) setBrand(prefill.brand);
        if (prefill.year) setYear(Number(prefill.year));
        if (prefill.km_driven !== undefined) setKmDriven(Number(prefill.km_driven));
        if (prefill.fuel) setFuel(prefill.fuel);
        if (prefill.transmission) setTransmission(prefill.transmission);
        if (prefill.owner) setOwner(prefill.owner);
        if (prefill.condition) setCondition(prefill.condition);
        if (prefill.working_status) setWorkingStatus(prefill.working_status);
        if (prefill.accident_history) setAccidentHistory(prefill.accident_history);
        if (prefill.service_history) setServiceHistory(prefill.service_history);
        if (prefill.extras) {
          try {
            const parsedExtras = typeof prefill.extras === 'string' ? JSON.parse(prefill.extras) : prefill.extras;
            setExtras({
              ac_working: Boolean(parsedExtras.ac_working),
              new_tyres: Boolean(parsedExtras.new_tyres),
              insurance_valid: Boolean(parsedExtras.insurance_valid),
            });
          } catch {
            // ignore
          }
        }
        return;
      }

      // Otherwise pre-fill defaults
      if (data.brands?.length > 0) {
        const preferredBrand = data.brands.includes(settings.defaultBrand)
          ? settings.defaultBrand
          : data.brands[0];
        setBrand(preferredBrand);
      }
      if (data.fuels?.length > 0) {
        const preferredFuel = data.fuels.includes(settings.defaultFuel)
          ? settings.defaultFuel
          : data.fuels[0];
        setFuel(preferredFuel);
      }
      if (data.current_year) {
        setYear(Math.min(2020, data.current_year));
      }
    } catch (err) {
      console.error('Failed to connect to backend API:', err);
      setServerError(true);
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, [settings.defaultBrand, settings.defaultFuel, location.state]);

  const validate = () => {
    const errors = {};
    if (!brand) errors.brand = 'Please select a vehicle brand';
    if (!metadata) return errors;

    if (year < metadata.year_min || year > metadata.current_year) {
      errors.year = `Year must be between ${metadata.year_min} and ${metadata.current_year}`;
    }

    if (kmDriven < 0 || kmDriven > metadata.km_max) {
      errors.kmDriven = `Distance must be between 0 and ${metadata.km_max.toLocaleString()} km`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setPredicting(true);
    try {
      const payload = {
        brand,
        year: Number(year),
        km_driven: Number(kmDriven),
        fuel,
        transmission,
        owner,
        condition,
        working_status: workingStatus,
        accident_history: accidentHistory,
        service_history: serviceHistory,
        extras,
      };

      const data = await api.predict(payload);
      setResult(data);
      setToastType('success');
      setToastMessage('Valuation calculated & auto-saved to history!');
    } catch (err) {
      console.error('Prediction failed:', err);
      setToastType('error');
      setToastMessage(err.response?.data?.detail?.message || 'Prediction failed. Check backend connection.');
    } finally {
      setPredicting(false);
    }
  };

  const handleResetForm = () => {
    setResult(null);
    if (metadata) {
      setBrand(metadata.brands[0] || 'Maruti');
      setYear(2020);
      setKmDriven(45000);
      setFuel(metadata.fuels[0] || 'Petrol');
      setTransmission(metadata.transmissions[0] || 'Manual');
      setOwner(metadata.owners[0] || 'First Owner');
    }
    setCondition('Good');
    setWorkingStatus('Fully working');
    setAccidentHistory('None');
    setServiceHistory('Partial');
    setExtras({ ac_working: false, new_tyres: false, insurance_valid: false });
  };

  // Add current predicted car to Compare list in localStorage
  const handleAddToCompare = () => {
    if (!result) return;
    try {
      const existing = JSON.parse(localStorage.getItem('rider_ai_compare_list') || '[]');
      const carObject = {
        brand,
        year: Number(year),
        km_driven: Number(kmDriven),
        fuel,
        transmission,
        owner,
        condition,
        working_status: workingStatus,
        accident_history: accidentHistory,
        service_history: serviceHistory,
        extras,
        predicted_price: result.predicted_price,
        base_price: result.base_price,
        health_score: result.health_score,
      };

      // Limit to 3 items
      const updated = [carObject, ...existing.filter((c) => !(c.brand === brand && c.year === year && c.km_driven === kmDriven))].slice(0, 3);
      localStorage.setItem('rider_ai_compare_list', JSON.stringify(updated));
      setToastType('success');
      setToastMessage(`Added ${brand} (${year}) to Compare list (${updated.length}/3 cars).`);
    } catch (e) {
      console.warn('Failed to save to compare list', e);
    }
  };

  // Navigate to Dashboard forecast tab with this car
  const handleForecastThisCar = () => {
    const carObject = {
      brand,
      year: Number(year),
      km_driven: Number(kmDriven),
      fuel,
      transmission,
      owner,
      condition,
      working_status: workingStatus,
      accident_history: accidentHistory,
      service_history: serviceHistory,
      extras,
      predicted_price: result?.predicted_price,
      base_price: result?.base_price,
      health_score: result?.health_score,
    };
    navigate('/dashboard', { state: { initialTab: 'future', car: carObject } });
  };

  // Convert km to current display unit for the slider & input
  const displayDistance = kmToDisplayDistance(kmDriven);
  const maxDisplayDistance = kmToDisplayDistance(metadata?.km_max || 250000);

  const handleDistanceChange = (e) => {
    const val = Number(e.target.value);
    setKmDriven(distanceToKm(val));
  };

  // Health Score Color Helper
  const getHealthScoreColor = (score) => {
    if (score >= 75) return { stroke: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    if (score >= 50) return { stroke: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    return { stroke: '#ef4444', text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
  };

  const healthScore = result?.health_score ?? 80;
  const healthStyle = getHealthScoreColor(healthScore);

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

      {/* Hero Banner */}
      <CarHero />

      {/* Server Offline Alert Banner */}
      {serverError && (
        <div className="glass-card rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-rose-300">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div>
              <h4 className="font-semibold text-rose-200">Backend Server Offline</h4>
              <p className="text-xs text-rose-300/80">
                Cannot reach FastAPI at http://localhost:8000. Ensure the server is running with: <code className="bg-black/30 px-1 py-0.5 rounded text-white font-mono text-[11px]">uvicorn backend.main:app --reload --port 8000</code>
              </p>
            </div>
          </div>
          <button
            onClick={fetchMeta}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs shadow-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Main Grid: Form + Result Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Input Specifications Form */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-7 glass-card rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl relative"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="font-tech text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-[#2f7bff]" />
                <span>Vehicle Specifications</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure core specifications and mechanical condition for exact resale estimation
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetForm}
              className="p-2 rounded-xl border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Reset all fields"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handlePredict} className="space-y-6">
            
            {/* Brand Select */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Vehicle Brand / Make
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                disabled={loadingMeta}
                className="w-full bg-[#0b0f1a]/80 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#2f7bff] focus:ring-1 focus:ring-[#2f7bff] transition-all cursor-pointer"
              >
                {metadata?.brands?.map((b) => (
                  <option key={b} value={b} className="bg-[#0b0f1a] text-white">
                    {b}
                  </option>
                ))}
              </select>
              {formErrors.brand && (
                <p className="text-xs text-rose-400">{formErrors.brand}</p>
              )}
            </div>

            {/* Year Slider + Number Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#2f7bff]" />
                  <span>Manufacturing Year</span>
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">
                    Age: {metadata?.current_year ? metadata.current_year - year : 2026 - year} yrs
                  </span>
                  <input
                    type="number"
                    min={metadata?.year_min || 2005}
                    max={metadata?.current_year || 2026}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-20 bg-[#0b0f1a]/80 border border-white/15 rounded-lg px-2.5 py-1 text-sm font-semibold text-center text-white focus:outline-none focus:border-[#2f7bff]"
                  />
                </div>
              </div>
              <input
                type="range"
                min={metadata?.year_min || 2005}
                max={metadata?.current_year || 2026}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full accent-[#2f7bff]"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{metadata?.year_min || 2005}</span>
                <span>{metadata?.current_year || 2026}</span>
              </div>
            </div>

            {/* Kilometres Driven Slider + Number Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#ff7a2f]" />
                  <span>Odometer Distance ({settings.distanceUnit.toUpperCase()})</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max={maxDisplayDistance}
                    step="1000"
                    value={displayDistance}
                    onChange={handleDistanceChange}
                    className="w-28 bg-[#0b0f1a]/80 border border-white/15 rounded-lg px-2.5 py-1 text-sm font-semibold text-center text-white focus:outline-none focus:border-[#2f7bff]"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={maxDisplayDistance}
                step="2500"
                value={displayDistance}
                onChange={handleDistanceChange}
                className="w-full accent-[#ff7a2f]"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0 {settings.distanceUnit}</span>
                <span>{formatDistance(metadata?.km_max || 250000)}</span>
              </div>
            </div>

            {/* Fuel Type Segmented Buttons */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Fuel className="w-3.5 h-3.5 text-[#2f7bff]" />
                <span>Fuel Type</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {(metadata?.fuels || ['Petrol', 'Diesel', 'CNG', 'LPG', 'Electric']).map((f) => {
                  const isSelected = fuel === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFuel(f)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border ${
                        isSelected
                          ? 'bg-[#2f7bff] text-white border-[#2f7bff] shadow-glow'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transmission & Ownership Split */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Transmission Toggle */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Transmission
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#0b0f1a]/80 p-1.5 rounded-xl border border-white/10">
                  {(metadata?.transmissions || ['Manual', 'Automatic']).map((t) => {
                    const isSelected = transmission === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTransmission(t)}
                        className={`py-2 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#2f7bff] to-[#38bdf8] text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ownership Type */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Ownership Tier
                </label>
                <select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full bg-[#0b0f1a]/80 border border-white/15 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#2f7bff] transition-all cursor-pointer"
                >
                  {(metadata?.owners || [
                    'First Owner',
                    'Second Owner',
                    'Third Owner',
                    'Fourth & Above Owner',
                  ]).map((o) => (
                    <option key={o} value={o} className="bg-[#0b0f1a] text-white">
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* =============================================================== */}
            {/* EXTENDED CONDITION, WORKING STATUS, ACCIDENT & SERVICE SECTION  */}
            {/* =============================================================== */}
            <div className="pt-4 border-t border-white/10 space-y-5">
              <div className="flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-[#ff7a2f]" />
                <h3 className="font-tech text-base font-bold text-white tracking-wide">
                  Vehicle Condition & Working Status
                </h3>
              </div>

              {/* 1. Overall Condition Segmented Buttons */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Overall Condition
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Excellent', 'Good', 'Fair', 'Poor'].map((cond) => {
                    const isSelected = condition === cond;
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setCondition(cond)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-[#2f7bff] text-white border-[#2f7bff] shadow-glow'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Working Status Select */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Mechanical Working Status
                </label>
                <select
                  value={workingStatus}
                  onChange={(e) => setWorkingStatus(e.target.value)}
                  className="w-full bg-[#0b0f1a]/80 border border-white/15 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#2f7bff] cursor-pointer"
                >
                  <option value="Fully working">Fully working (Zero operational defects)</option>
                  <option value="Minor issues">Minor issues (Cosmetic / small sensor faults)</option>
                  <option value="Major repairs needed">Major repairs needed (Engine / Gearbox overhaul)</option>
                  <option value="Not running">Not running (Salvage / Non-operational)</option>
                </select>
              </div>

              {/* 3. Accident History & Service History Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Accident History */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Accident History</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-[#0b0f1a]/80 p-1.5 rounded-xl border border-white/10">
                    {['None', 'Minor', 'Major'].map((acc) => {
                      const isSelected = accidentHistory === acc;
                      return (
                        <button
                          key={acc}
                          type="button"
                          onClick={() => setAccidentHistory(acc)}
                          className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#2f7bff] to-[#38bdf8] text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {acc}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Service History */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Service History</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-[#0b0f1a]/80 p-1.5 rounded-xl border border-white/10">
                    {['Full records', 'Partial', 'None'].map((serv) => {
                      const isSelected = serviceHistory === serv;
                      return (
                        <button
                          key={serv}
                          type="button"
                          onClick={() => setServiceHistory(serv)}
                          className={`py-1.5 rounded-lg text-xs font-semibold transition-all truncate px-1 ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#2f7bff] to-[#38bdf8] text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {serv === 'Full records' ? 'Full' : serv}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 4. Optional Extras Checkboxes */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Optional Equipment & Status Extras
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={extras.ac_working}
                      onChange={(e) => setExtras({ ...extras, ac_working: e.target.checked })}
                      className="w-4 h-4 rounded text-[#2f7bff] accent-[#2f7bff] bg-[#0b0f1a] border-white/20"
                    />
                    <span className="text-xs font-medium text-slate-200">AC Working (+2%)</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={extras.new_tyres}
                      onChange={(e) => setExtras({ ...extras, new_tyres: e.target.checked })}
                      className="w-4 h-4 rounded text-[#2f7bff] accent-[#2f7bff] bg-[#0b0f1a] border-white/20"
                    />
                    <span className="text-xs font-medium text-slate-200">New Tyres (+2%)</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={extras.insurance_valid}
                      onChange={(e) => setExtras({ ...extras, insurance_valid: e.target.checked })}
                      className="w-4 h-4 rounded text-[#2f7bff] accent-[#2f7bff] bg-[#0b0f1a] border-white/20"
                    />
                    <span className="text-xs font-medium text-slate-200">Insurance Valid (+1%)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={predicting || loadingMeta}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#2f7bff] via-[#3b82f6] to-[#ff7a2f] text-white font-tech font-bold text-base sm:text-lg tracking-wider uppercase shadow-glow hover:shadow-[0_0_35px_-5px_rgba(47,123,255,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {predicting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Computing Market Valuation...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  <span>Predict Resale Price</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Right: Valuation Result Panel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-5 glass-card rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[640px]"
        >
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="font-tech text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#ff7a2f]" />
                <span>Valuation Result</span>
              </h2>
              {result && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ID #{result.id}
                </span>
              )}
            </div>

            {/* Result Content */}
            {result ? (
              <div className="space-y-6 pt-4">
                {/* Speedometer Gauge Component showing Adjusted Price */}
                <Gauge
                  predictedPrice={result.predicted_price}
                  priceLow={result.price_low}
                  priceHigh={result.price_high}
                  carAge={result.car_age}
                  brand={brand}
                  year={year}
                />

                {/* Model Price vs Adjusted Price Mini Row */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-slate-400">
                      Base ML Model Price
                    </span>
                    <span className="font-tech text-base sm:text-lg font-bold text-slate-300">
                      {formatPrice(result.base_price)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[11px] uppercase tracking-wider text-slate-400">
                      Condition Adjusted
                    </span>
                    <span className="font-tech text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#38bdf8]">
                      {formatPrice(result.predicted_price)}
                    </span>
                  </div>
                </div>

                {/* Vehicle Health Score Ring & Price Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  
                  {/* Health Score Circular Ring */}
                  <div className={`sm:col-span-5 p-4 rounded-2xl ${healthStyle.bg} border ${healthStyle.border} flex flex-col items-center justify-center text-center space-y-1`}>
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="6"
                          fill="none"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke={healthStyle.stroke}
                          strokeWidth="6"
                          strokeDasharray={201}
                          strokeDashoffset={201 - (201 * healthScore) / 100}
                          strokeLinecap="round"
                          fill="none"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`font-tech text-xl font-extrabold ${healthStyle.text}`}>
                          {healthScore}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400">
                          / 100
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-white tracking-wide">
                      Vehicle Health
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {healthScore >= 75 ? 'Optimal Maintenance' : healthScore >= 50 ? 'Fair Condition' : 'Major Wear'}
                    </span>
                  </div>

                  {/* Price Breakdown List */}
                  <div className="sm:col-span-7 space-y-1.5">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Factor Impact Breakdown
                    </span>
                    {result.breakdown && result.breakdown.length > 0 ? (
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {result.breakdown.map((item, idx) => {
                          const isPositive = item.impact >= 0;
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-white/5 border border-white/5"
                            >
                              <span className="text-slate-300 truncate mr-2">{item.factor}</span>
                              <span className={`font-mono font-semibold flex items-center shrink-0 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isPositive ? <TrendingUp className="w-3 h-3 mr-1 inline" /> : <TrendingDown className="w-3 h-3 mr-1 inline" />}
                                {isPositive ? '+' : ''}{formatPrice(item.impact)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 bg-white/5 p-3 rounded-lg border border-white/5">
                        Baseline condition parameters applied (0% net deviation from base model).
                      </div>
                    )}
                  </div>
                </div>

                {/* Mandatory Disclaimer Note */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
                  <span className="font-semibold text-amber-300">Note: </span>
                  Condition and working-status adjustments are rule-based estimates, not learned from data.
                </div>
              </div>
            ) : (
              /* Empty Placeholder State */
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400">
                  <SlidersHorizontal className="w-10 h-10 text-[#2f7bff]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-tech text-lg font-bold text-white">
                    Awaiting Vehicle Specs
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Select brand, year, mileage, and condition parameters to calculate an adjusted market resale price.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions if Result is Available */}
          {result && (
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleAddToCompare}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#2f7bff]/20 hover:bg-[#2f7bff]/30 border border-[#2f7bff]/30 text-xs font-semibold text-white transition-all flex items-center justify-center space-x-1.5"
              >
                <GitCompare className="w-4 h-4 text-[#38bdf8]" />
                <span>Add to Compare</span>
              </button>

              <button
                type="button"
                onClick={handleForecastThisCar}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#ff7a2f]/20 hover:bg-[#ff7a2f]/30 border border-[#ff7a2f]/30 text-xs font-semibold text-white transition-all flex items-center justify-center space-x-1.5"
              >
                <TrendingUp className="w-4 h-4 text-[#ff7a2f]" />
                <span>Forecast This Car</span>
              </button>

              <button
                type="button"
                onClick={() => setResult(null)}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Predict Another
              </button>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
};

export default Predictor;
