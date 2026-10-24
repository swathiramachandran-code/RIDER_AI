import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-[#38bdf8] shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-[#0b0f1a]/95 text-emerald-100',
    warning: 'border-amber-500/30 bg-[#0b0f1a]/95 text-amber-100',
    error: 'border-rose-500/30 bg-[#0b0f1a]/95 text-rose-100',
    info: 'border-[#2f7bff]/30 bg-[#0b0f1a]/95 text-blue-100',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl border shadow-2xl backdrop-blur-xl ${borders[type]}`}
        >
          <div className="flex items-center space-x-3 mr-3">
            {icons[type]}
            <p className="text-sm font-medium text-slate-100">{message}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Toast;
