import React from 'react';
import {
  Zap,
  MapPin,
  Layers,
  Sparkles,
  Radio,
  LogIn,
  Compass,
  ShieldCheck,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { WasteReport } from '../types/wasteReport';
import { AuthUser } from '../types/auth';

interface HomePageProps {
  onNavigate: (tab: 'home' | 'report' | 'feed' | 'map' | 'admin' | 'impact') => void;
  onOpenLoginModal: () => void;
  reports: WasteReport[];
  currentUser: AuthUser | null;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onOpenLoginModal,
  currentUser,
}) => {
  return (
    <div
      className="min-h-[calc(100vh-4rem)] flex flex-col justify-between relative overflow-hidden bg-[#fbfdfc]"
      style={{
        backgroundImage: 'radial-gradient(#10b98124 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Dynamic Animated Ambient Glow Blobs in Background */}
      <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-emerald-200/35 rounded-full blur-[100px] pointer-events-none animate-blob-1" />
      <div className="absolute top-1/3 -right-20 w-[450px] h-[450px] bg-teal-200/30 rounded-full blur-[110px] pointer-events-none animate-blob-2" />
      <div className="absolute -bottom-20 left-1/3 w-[600px] h-[350px] bg-emerald-100/40 rounded-full blur-[90px] pointer-events-none animate-blob-1" />

      {/* Futuristic Radar Scan Sweep Line over Dot Grid */}
      <div className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent pointer-events-none animate-scan-line" />

      {/* Floating Civic Cleanliness Micro Particles */}
      <div className="absolute top-24 left-[10%] w-2 h-2 rounded-full bg-emerald-400/60 shadow-sm shadow-emerald-400 pointer-events-none animate-particle-1" />
      <div className="absolute top-44 right-[12%] w-2.5 h-2.5 rounded-full bg-teal-400/50 shadow-sm shadow-teal-400 pointer-events-none animate-particle-2" />
      <div className="absolute bottom-36 left-[15%] w-2 h-2 rounded-full bg-emerald-500/40 pointer-events-none animate-particle-3" />
      <div className="absolute bottom-48 right-[18%] w-1.5 h-1.5 rounded-full bg-emerald-400/50 pointer-events-none animate-particle-1" />

      {/* Main Centered Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-10 flex-1 flex flex-col items-center justify-center text-center">
        {/* Hero Title with Shimmering Gradient Pulse */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 mb-4 select-none drop-shadow-xs">
          <span>Eco</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 animate-gradient-shift">
            Pulse
          </span>
        </h1>

        {/* Hero Tagline */}
        <p className="text-base sm:text-lg text-slate-600 font-medium max-w-xl mx-auto leading-relaxed mb-8">
          Detect, pinpoint, and resolve urban waste with live GPS satellite tracking and computer vision AI municipal dispatch.
        </p>

        {/* Primary CTA Button with Interactive Light Reflection Shimmer */}
        <div className="w-full flex justify-center mb-3">
          <button
            type="button"
            onClick={() => onNavigate('report')}
            className="w-full sm:w-[460px] py-4 px-6 rounded-2xl bg-[#00875a] hover:bg-[#00734c] active:scale-[0.99] text-white font-bold text-base shadow-md shadow-emerald-900/10 hover:shadow-xl hover:shadow-emerald-900/20 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer relative overflow-hidden group"
          >
            {/* Shimmer Light Reflection passing across button */}
            <span className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <Zap className="w-5 h-5 fill-white text-white group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
            <span className="tracking-wide">Report Waste Issue Now</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1.5 transition-transform duration-200" />
          </button>
        </div>

        {/* Second Row: Pinpoint GPS + Public Incident Feed (with hover elevation & glow) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-[460px] mb-2.5">
          <button
            type="button"
            onClick={() => onNavigate('map')}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-white hover:bg-emerald-50/40 active:scale-[0.99] border border-slate-200/90 hover:border-emerald-400 text-slate-800 hover:text-emerald-950 font-bold text-sm shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-50 group-hover:bg-emerald-100/80 flex items-center justify-center transition-colors">
              <MapPin className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <span>Pinpoint Waste on GPS</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('feed')}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-white hover:bg-emerald-50/40 active:scale-[0.99] border border-slate-200/90 hover:border-emerald-400 text-slate-800 hover:text-emerald-950 font-bold text-sm shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-50 group-hover:bg-emerald-100/80 flex items-center justify-center transition-colors">
              <Layers className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <span>Public Incident Feed</span>
          </button>
        </div>

        {/* Third Row: AI Vision Scan + Dispatch Console + Account Login */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full sm:w-[460px] mb-8">
          <button
            type="button"
            onClick={() => onNavigate('report')}
            className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 active:scale-[0.99] border border-emerald-300 text-slate-800 hover:text-emerald-950 font-semibold text-xs sm:text-sm shadow-xs hover:shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer group"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-45 group-hover:scale-110 transition-transform duration-300" />
            <span>AI Vision Scan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (currentUser?.role === 'admin' || currentUser?.role === 'staff') {
                onNavigate('admin');
              } else {
                onOpenLoginModal();
              }
            }}
            className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-200 hover:border-amber-300 text-slate-800 hover:text-amber-950 font-semibold text-xs sm:text-sm shadow-xs hover:shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer group"
          >
            <Radio className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
            <span>Dispatch Console</span>
          </button>

          <button
            type="button"
            onClick={onOpenLoginModal}
            className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-200 hover:border-slate-400 text-slate-800 font-semibold text-xs sm:text-sm shadow-xs hover:shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer group"
          >
            <LogIn className="w-3.5 h-3.5 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
            <span>Account Login</span>
          </button>
        </div>

        {/* Three Pillars Feature Cards with Hover Elevation and Accent Bars */}
        <div className="w-full max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Card 1 */}
          <div className="group relative overflow-hidden bg-white/95 backdrop-blur-xs border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-5 text-left shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-default">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-100/70 transition-all duration-300 shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1.5 group-hover:text-emerald-800 transition-colors">
              Pinpoint GPS Accuracy
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Fine-tune incident markers with satellite mapping and colony search.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group relative overflow-hidden bg-white/95 backdrop-blur-xs border border-slate-200/90 hover:border-teal-300 rounded-2xl p-5 text-left shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-default">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-teal-100/70 transition-all duration-300 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1.5 group-hover:text-teal-800 transition-colors">
              AI Hazard Diagnosis
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Automatic photo classification, priority scoring, and crew dispatch advice.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group relative overflow-hidden bg-white/95 backdrop-blur-xs border border-slate-200/90 hover:border-amber-300 rounded-2xl p-5 text-left shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-default">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-amber-100/70 transition-all duration-300 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1.5 group-hover:text-amber-800 transition-colors">
              Municipal Verification
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Public tracking ticket lifecycle from triage to completed resolution.
            </p>
          </div>
        </div>
      </div>

      {/* Clean Footer Attribution */}
      <footer className="relative z-10 py-6 text-center">
        <div className="w-20 h-px bg-slate-200/80 mx-auto mb-3" />
        <p className="text-xs text-slate-500">
          Developed by <span className="font-bold text-slate-800 hover:text-emerald-700 transition-colors">Aditya Srivastava</span>
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
