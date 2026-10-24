import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Trash2, 
  Download, 
  ArrowUpDown, 
  Car, 
  Calendar, 
  Clock, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Fuel,
  Activity
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import api from '../api';
import Toast from '../components/Toast';
import { TableSkeleton } from '../components/Skeleton';

export const History = () => {
  const { settings, formatPrice, formatDistance } = useSettings();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, price_desc, price_asc, km_desc
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getHistory({ search: search.trim() || undefined, limit: 200 });
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
      setToastType('error');
      setToastMessage('Could not load prediction history. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search]);

  // Sort logic
  const sortedHistory = [...history].sort((a, b) => {
    if (sortBy === 'date_desc') {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    if (sortBy === 'date_asc') {
      return new Date(a.created_at) - new Date(b.created_at);
    }
    if (sortBy === 'price_desc') {
      return b.predicted_price - a.predicted_price;
    }
    if (sortBy === 'price_asc') {
      return a.predicted_price - b.predicted_price;
    }
    if (sortBy === 'km_desc') {
      return b.km_driven - a.km_driven;
    }
    return 0;
  });

  // Delete single prediction
  const handleDeleteItem = async (id) => {
    try {
      await api.deleteHistoryItem(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      setConfirmDeleteId(null);
      setToastType('success');
      setToastMessage(`Prediction #${id} deleted.`);
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage('Failed to delete history record.');
    }
  };

  // Clear all prediction history
  const handleClearAll = async () => {
    try {
      await api.clearHistory();
      setHistory([]);
      setConfirmClearAll(false);
      setToastType('success');
      setToastMessage('All prediction records cleared.');
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage('Failed to clear history.');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (history.length === 0) return;

    const headers = [
      'ID',
      'Date (UTC)',
      'Brand',
      'Year',
      'Distance (km)',
      'Fuel',
      'Transmission',
      'Owner',
      'Predicted Price (INR)',
      'Price Low (INR)',
      'Price High (INR)',
    ];

    const rows = history.map((item) => [
      item.id,
      item.created_at,
      `"${item.brand}"`,
      item.year,
      item.km_driven,
      `"${item.fuel}"`,
      `"${item.transmission}"`,
      `"${item.owner}"`,
      item.predicted_price,
      item.price_low,
      item.price_high,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vehicle_resale_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastType('info');
    setToastMessage('CSV export downloaded successfully!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-tech text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
            <span>Valuation History</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#2f7bff]/20 text-[#38bdf8] border border-[#2f7bff]/30">
              {history.length} {history.length === 1 ? 'Record' : 'Records'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse, filter, search, and export past vehicle resale price appraisals
          </p>
        </div>

        {/* Global Table Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            disabled={history.length === 0}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 text-[#38bdf8]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setConfirmClearAll(true)}
            disabled={history.length === 0}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 glass-card p-4 rounded-2xl border border-white/10">
        {/* Search Box */}
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by brand, fuel, transmission, or owner..."
            className="w-full bg-[#0b0f1a]/80 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#2f7bff]"
          />
        </div>

        {/* Sort Selector */}
        <div className="sm:col-span-4 flex items-center space-x-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-[#0b0f1a]/80 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#2f7bff] cursor-pointer"
          >
            <option value="date_desc">Sort: Newest First</option>
            <option value="date_asc">Sort: Oldest First</option>
            <option value="price_desc">Sort: Highest Valuation</option>
            <option value="price_asc">Sort: Lowest Valuation</option>
            <option value="km_desc">Sort: Highest Mileage</option>
          </select>
        </div>
      </div>

      {/* Records Table or Skeletons or Empty State */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : sortedHistory.length > 0 ? (
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-semibold tracking-wider uppercase text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                  <th className="py-3.5 px-4 sm:px-6">Vehicle Summary</th>
                  <th className="py-3.5 px-4 sm:px-6">Distance</th>
                  <th className="py-3.5 px-4 sm:px-6">Valuation (Est.)</th>
                  <th className="py-3.5 px-4 sm:px-6">Likely Range</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {sortedHistory.map((row) => {
                  const createdDate = new Date(row.created_at);
                  const isCompact = settings.compactTable;

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      {/* Timestamp */}
                      <td className={`${isCompact ? 'py-2.5' : 'py-4'} px-4 sm:px-6 whitespace-nowrap`}>
                        <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {createdDate.toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {createdDate.toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Vehicle Summary */}
                      <td className={`${isCompact ? 'py-2.5' : 'py-4'} px-4 sm:px-6`}>
                        <div className="font-semibold text-white text-sm flex items-center space-x-2">
                          <span>{row.brand}</span>
                          <span className="text-xs text-slate-400 font-normal">({row.year})</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                            {row.fuel}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2f7bff]/10 text-[#38bdf8] border border-[#2f7bff]/20">
                            {row.transmission}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                            {row.owner}
                          </span>
                        </div>
                      </td>

                      {/* Distance */}
                      <td className={`${isCompact ? 'py-2.5' : 'py-4'} px-4 sm:px-6 whitespace-nowrap font-mono text-xs text-slate-300`}>
                        {formatDistance(row.km_driven)}
                      </td>

                      {/* Predicted Price */}
                      <td className={`${isCompact ? 'py-2.5' : 'py-4'} px-4 sm:px-6 whitespace-nowrap`}>
                        <span className="font-tech text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#38bdf8]">
                          {formatPrice(row.predicted_price)}
                        </span>
                      </td>

                      {/* Likely Range */}
                      <td className={`${isCompact ? 'py-2.5' : 'py-4'} px-4 sm:px-6 whitespace-nowrap text-xs text-slate-400`}>
                        <span>{formatPrice(row.price_low)}</span>
                        <span className="mx-1 text-slate-500">–</span>
                        <span className="text-slate-300">{formatPrice(row.price_high)}</span>
                      </td>

                      {/* Actions */}
                      <td className={`${isCompact ? 'py-2.5' : 'py-4'} px-4 sm:px-6 text-right whitespace-nowrap`}>
                        {confirmDeleteId === row.id ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleDeleteItem(row.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-[11px] transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(row.id)}
                            className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete this prediction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State Illustration */
        <div className="glass-card rounded-3xl border border-white/10 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-[#2f7bff]">
            <Car className="w-12 h-12" />
          </div>
          <div className="space-y-1">
            <h3 className="font-tech text-xl font-bold text-white">
              No Appraisals Found
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm">
              {search
                ? `No historical predictions match "${search}". Try searching for another brand or clear filters.`
                : 'You have not evaluated any vehicles yet. Run your first prediction to see records here.'}
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2f7bff] to-[#ff7a2f] text-white font-medium text-xs sm:text-sm shadow-glow transition-transform hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            <span>Valuate A Vehicle Now</span>
          </Link>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {confirmClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-2xl border border-rose-500/30 bg-[#0b0f1a] p-6 max-w-sm w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-tech text-lg font-bold text-white">Clear All History?</h3>
            </div>
            <p className="text-xs text-slate-300">
              This will permanently wipe all {history.length} vehicle appraisal records from your database. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmClearAll(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-lg"
              >
                Yes, Delete All
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default History;
