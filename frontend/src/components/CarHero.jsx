import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Shield, Cpu, Gauge } from 'lucide-react';

export const CarHero = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl glass-card border border-white/10 p-6 sm:p-10 mb-8">
      {/* Background radial spotlights */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#2f7bff]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#ff7a2f]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Headlines & Badges */}
        <div className="lg:col-span-7 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#2f7bff]/15 text-[#38bdf8] border border-[#2f7bff]/30"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>RIDER_AI Valuation Engine • India Market Edition</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-tech text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white"
          >
            Know your car's <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2f7bff] via-[#38bdf8] to-[#ff7a2f]">true resale value</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl"
          >
            Get an instant, hyper-accurate price estimation backed by machine learning regression. 
            Calibrated on thousands of verified automotive transactions across fuel types, 
            mileage wear, and ownership tiers.
          </motion.p>

          {/* Feature Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-2.5 pt-2"
          >
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-slate-300">
              <Gauge className="w-3.5 h-3.5 text-[#2f7bff]" />
              <span>Sub-Second Prediction</span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-slate-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>IQR Outlier Filtered</span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-[#ff7a2f]" />
              <span>Log-Linear Target Calibrated</span>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Inline SVG Car Silhouette with Lighting Effects */}
        <div className="lg:col-span-5 flex justify-center items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative w-full max-w-md"
          >
            {/* SVG Car Silhouette */}
            <svg
              viewBox="0 0 540 220"
              className="w-full h-auto drop-shadow-[0_15px_25px_rgba(47,123,255,0.25)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Body Metallic Gradient */}
                <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="50%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>

                {/* Cyber Accent Line */}
                <linearGradient id="neonStripe" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2f7bff" stopOpacity="0" />
                  <stop offset="30%" stopColor="#2f7bff" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#38bdf8" stopOpacity="1" />
                  <stop offset="100%" stopColor="#ff7a2f" stopOpacity="0.8" />
                </linearGradient>

                {/* Headlight Beam Glow */}
                <radialGradient id="headlightGlow" cx="0%" cy="50%" r="80%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#2f7bff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#2f7bff" stopOpacity="0" />
                </radialGradient>

                {/* Taillight Beam Glow */}
                <radialGradient id="taillightGlow" cx="100%" cy="50%" r="80%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Headlight beam casting forward */}
              <polygon points="500,126 540,110 540,150 500,132" fill="url(#headlightGlow)" />
              {/* Taillight glow */}
              <polygon points="40,122 0,115 0,140 40,130" fill="url(#taillightGlow)" />

              {/* Underglow Neon Tube */}
              <line x1="90" y1="184" x2="450" y2="184" stroke="#2f7bff" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
              <line x1="120" y1="184" x2="420" y2="184" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.9" />

              {/* Sleek Aerodynamic Car Silhouette Body */}
              <path
                d="M 35 130 
                   C 35 125, 45 110, 65 105
                   C 95 98, 140 92, 175 68
                   C 205 48, 255 38, 320 38
                   C 375 38, 410 58, 440 92
                   C 470 102, 495 112, 508 124
                   C 514 130, 514 138, 508 144
                   C 498 154, 480 156, 465 156
                   C 460 140, 442 128, 420 128
                   C 398 128, 380 140, 375 156
                   L 175 156
                   C 170 140, 152 128, 130 128
                   C 108 128, 90 140, 85 156
                   L 45 156
                   C 38 156, 35 145, 35 130 Z"
                fill="url(#carBodyGrad)"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="2.5"
              />

              {/* Cabin Glass / Windshield */}
              <path
                d="M 188 74 
                   C 215 54, 258 46, 318 46
                   C 362 46, 394 62, 420 92
                   L 322 92
                   L 188 74 Z"
                fill="rgba(47, 123, 255, 0.15)"
                stroke="rgba(56, 189, 248, 0.4)"
                strokeWidth="1.5"
              />

              {/* Side window divider */}
              <line x1="318" y1="46" x2="320" y2="92" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" />

              {/* Dynamic Shoulder Line (Cyber Stripe) */}
              <path
                d="M 50 118 Q 230 102 500 128"
                stroke="url(#neonStripe)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Wheels */}
              {/* Front Wheel */}
              <circle cx="420" cy="156" r="28" fill="#0b0f1a" stroke="#334155" strokeWidth="6" />
              <circle cx="420" cy="156" r="16" fill="#1e293b" stroke="#2f7bff" strokeWidth="2.5" />
              <circle cx="420" cy="156" r="6" fill="#38bdf8" />
              <line x1="420" y1="130" x2="420" y2="182" stroke="#475569" strokeWidth="2" />
              <line x1="394" y1="156" x2="446" y2="156" stroke="#475569" strokeWidth="2" />

              {/* Rear Wheel */}
              <circle cx="130" cy="156" r="28" fill="#0b0f1a" stroke="#334155" strokeWidth="6" />
              <circle cx="130" cy="156" r="16" fill="#1e293b" stroke="#2f7bff" strokeWidth="2.5" />
              <circle cx="130" cy="156" r="6" fill="#38bdf8" />
              <line x1="130" y1="130" x2="130" y2="182" stroke="#475569" strokeWidth="2" />
              <line x1="104" y1="156" x2="156" y2="156" stroke="#475569" strokeWidth="2" />

              {/* Headlight cluster */}
              <ellipse cx="496" cy="128" rx="6" ry="3" fill="#38bdf8" />
              {/* Taillight bar */}
              <line x1="40" y1="126" x2="52" y2="124" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CarHero;
