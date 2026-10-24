import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const Gauge = ({ 
  predictedPrice = 0, 
  priceLow = 0, 
  priceHigh = 0, 
  carAge = 0,
  brand = '',
  year = 2020
}) => {
  const { formatPrice } = useSettings();

  // Dynamic maximum valuation ceiling for speedometer scale
  const maxScalePrice = useMemo(() => {
    if (!predictedPrice) return 2000000;
    if (predictedPrice > 3000000) {
      return Math.ceil((predictedPrice * 1.3) / 1000000) * 1000000;
    }
    return Math.max(1500000, Math.ceil((predictedPrice * 1.35) / 250000) * 250000);
  }, [predictedPrice]);

  // Speedometer spans 240 degrees (from -120° to +120°)
  const startAngle = -120;
  const totalAngle = 240;
  const ratio = Math.min(1, Math.max(0, predictedPrice / maxScalePrice));
  const needleAngle = startAngle + ratio * totalAngle;

  // Arc path generation
  const radius = 120;
  const center = 150;

  const polarToCartesian = (centerX, centerY, rad, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + rad * Math.cos(angleInRadians),
      y: centerY + rad * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x, y, rad, startAng, endAng) => {
    const start = polarToCartesian(x, y, rad, endAng);
    const end = polarToCartesian(x, y, rad, startAng);
    const arcSweep = endAng - startAng <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', rad, rad, 0, arcSweep, 0, end.x, end.y].join(' ');
  };

  const backgroundArc = describeArc(center, center, radius, startAngle, startAngle + totalAngle);
  const activeArc = describeArc(center, center, radius, startAngle, startAngle + ratio * totalAngle);

  // Generate tick marks
  const ticks = useMemo(() => {
    const items = [];
    const numTicks = 9; // 0%, 12.5%, ..., 100%
    for (let i = 0; i <= numTicks; i++) {
      const tickFraction = i / numTicks;
      const angle = startAngle + tickFraction * totalAngle;
      const innerRad = i % 2 === 0 ? radius - 14 : radius - 8;
      const p1 = polarToCartesian(center, center, radius - 2, angle);
      const p2 = polarToCartesian(center, center, innerRad, angle);
      const labelPrice = Math.round(tickFraction * maxScalePrice);
      const labelPos = polarToCartesian(center, center, radius - 26, angle);

      items.push({
        id: i,
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        isMajor: i % 2 === 0,
        label: i % 2 === 0 ? `${(labelPrice / 100000).toFixed(1)}L` : null,
        labelX: labelPos.x,
        labelY: labelPos.y,
      });
    }
    return items;
  }, [maxScalePrice]);

  return (
    <div className="relative flex flex-col items-center justify-center p-6 text-center select-none">
      {/* SVG Speedometer Dial */}
      <div className="relative w-72 h-64 sm:w-80 sm:h-72 flex items-center justify-center">
        <svg viewBox="0 0 300 280" className="w-full h-full overflow-visible">
          <defs>
            {/* Speedometer Gradient */}
            <linearGradient id="gaugeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2f7bff" />
              <stop offset="60%" stopColor="#38bdf8" />
              <stop offset="85%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#ff7a2f" />
            </linearGradient>

            {/* Needle Glow Filter */}
            <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Active Arc Glow */}
            <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={backgroundArc}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Active Highlight Arc */}
          <motion.path
            d={activeArc}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            filter="url(#arcGlow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Ticks and scale numbers */}
          {ticks.map((t) => (
            <g key={t.id}>
              <line
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.isMajor ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.2)'}
                strokeWidth={t.isMajor ? 2.5 : 1.5}
                strokeLinecap="round"
              />
              {t.label && (
                <text
                  x={t.labelX}
                  y={t.labelY}
                  fill="rgba(255, 255, 255, 0.45)"
                  fontSize="9"
                  fontFamily="Rajdhani, sans-serif"
                  fontWeight="600"
                  textAnchor="middle"
                  alignmentBaseline="central"
                >
                  {t.label}
                </text>
              )}
            </g>
          ))}

          {/* Animated Speedometer Needle */}
          <motion.g
            initial={{ rotate: startAngle }}
            animate={{ rotate: needleAngle }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ originX: '150px', originY: '150px' }}
          >
            {/* Needle Line */}
            <line
              x1="150"
              y1="150"
              x2="150"
              y2="42"
              stroke="#ff7a2f"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="url(#needleGlow)"
            />
            {/* Needle accent triangle */}
            <polygon points="146,145 154,145 150,38" fill="#ff7a2f" />
          </motion.g>

          {/* Needle Center Hub */}
          <circle cx="150" cy="150" r="14" fill="#0b0f1a" stroke="#2f7bff" strokeWidth="3" />
          <circle cx="150" cy="150" r="6" fill="#ff7a2f" />
        </svg>

        {/* Ambient Center Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#2f7bff]/15 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Primary Value Readout */}
      <div className="-mt-10 sm:-mt-8 space-y-1.5 z-10">
        <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Estimated Resale Price
        </div>
        <motion.div
          key={predictedPrice}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-tech text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#38bdf8] drop-shadow-sm"
        >
          {formatPrice(predictedPrice)}
        </motion.div>

        {/* Likely Price Range */}
        <div className="flex items-center justify-center space-x-1.5 text-xs sm:text-sm font-medium text-slate-300">
          <span className="text-slate-400">Likely Range:</span>
          <span className="text-[#38bdf8] font-semibold">{formatPrice(priceLow)}</span>
          <span className="text-slate-500">–</span>
          <span className="text-[#ff7a2f] font-semibold">{formatPrice(priceHigh)}</span>
        </div>

        {/* Confidence Badge */}
        <div className="pt-2 flex items-center justify-center">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>High Confidence • R² ≈ 0.98</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gauge;
