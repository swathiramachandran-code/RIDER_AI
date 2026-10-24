import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const StatCard = ({
  title,
  value,
  isNumeric = true,
  decimals = 4,
  prefix = '',
  suffix = '',
  subtitle,
  icon: Icon,
  trend,
  color = 'blue', // 'blue', 'orange', 'emerald', 'purple'
}) => {
  const [displayValue, setDisplayValue] = useState(isNumeric ? 0 : value);

  useEffect(() => {
    if (!isNumeric) {
      setDisplayValue(value);
      return;
    }

    const target = parseFloat(value) || 0;
    const duration = 1200; // ms
    const frameRate = 60;
    const totalFrames = Math.round((duration / 1000) * frameRate);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // Ease out cubic
      const current = target * (1 - Math.pow(1 - progress, 3));
      setDisplayValue(current);

      if (frame >= totalFrames) {
        setDisplayValue(target);
        clearInterval(timer);
      }
    }, 1000 / frameRate);

    return () => clearInterval(timer);
  }, [value, isNumeric]);

  const colorStyles = {
    blue: {
      border: 'hover:border-[#2f7bff]/40',
      iconBg: 'bg-[#2f7bff]/15 text-[#38bdf8]',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(47,123,255,0.3)]',
    },
    orange: {
      border: 'hover:border-[#ff7a2f]/40',
      iconBg: 'bg-[#ff7a2f]/15 text-[#fb923c]',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(255,122,47,0.3)]',
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/15 text-emerald-400',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.3)]',
    },
    purple: {
      border: 'hover:border-purple-500/40',
      iconBg: 'bg-purple-500/15 text-purple-400',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(168,85,247,0.3)]',
    },
  }[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`group relative glass-card p-5 sm:p-6 rounded-2xl border border-white/10 transition-all duration-300 ${colorStyles.border} ${colorStyles.glow}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            {title}
          </p>
          <div className="font-tech text-2xl sm:text-3xl font-extrabold text-white">
            {prefix}
            {isNumeric
              ? Number(displayValue).toLocaleString(undefined, {
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals,
                })
              : displayValue}
            {suffix}
          </div>
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-xl ${colorStyles.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span>{subtitle}</span>
          {trend && (
            <span className="font-medium text-emerald-400 flex items-center space-x-1">
              <span>{trend}</span>
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
