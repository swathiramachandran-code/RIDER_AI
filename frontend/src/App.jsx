import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { 
  Gauge as SpeedIcon, 
  History as HistoryIcon, 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  User, 
  Car 
} from 'lucide-react';
import { SettingsProvider } from './context/SettingsContext';
import { ProfileProvider } from './context/ProfileContext';
import Navbar from './components/Navbar';
import Predictor from './pages/Predictor';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

function AppContent() {
  const bottomNavItems = [
    { name: 'Predict', path: '/', icon: SpeedIcon },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'History', path: '/history', icon: HistoryIcon },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col mesh-bg text-slate-100 selection:bg-[#2f7bff]/30 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content View */}
      <main className="flex-1 pb-20 md:pb-12">
        <Routes>
          <Route path="/" element={<Predictor />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Predictor />} />
        </Routes>
      </main>

      {/* Desktop Footer */}
      <footer className="border-t border-white/10 py-6 bg-[#0b0f1a]/60 backdrop-blur-md hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center space-x-2">
            <Car className="w-4 h-4 text-[#2f7bff]" />
            <span className="font-tech font-bold text-white tracking-wider">RIDER_AI</span>
            <span>— Precision Used Vehicle Resale Valuation Engine</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Trained on CarDekho Historical Transactions</span>
            <span className="text-slate-600">•</span>
            <span>FastAPI + Scikit-Learn + React 18</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0b0f1a]/95 backdrop-blur-xl border-t border-white/10 px-2 py-2 flex items-center justify-around shadow-2xl">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-all ${
                  isActive
                    ? 'text-white font-bold bg-[#2f7bff]/20 border border-[#2f7bff]/30'
                    : 'text-slate-400 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[#2f7bff]' : ''}`} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <ProfileProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ProfileProvider>
    </SettingsProvider>
  );
}
