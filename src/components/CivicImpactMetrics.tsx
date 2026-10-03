import React from 'react';
import {
  CheckCircle2,
  Clock,
  Truck,
  Recycle,
  ShieldCheck,
  Building2,
  MapPin,
} from 'lucide-react';
import { WasteReport } from '../types/wasteReport';

interface CivicImpactMetricsProps {
  reports?: WasteReport[];
}

export const CivicImpactMetrics: React.FC<CivicImpactMetricsProps> = ({ reports = [] }) => {
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;
  const inProgressCount = reports.filter((r) => r.status === 'in_progress').length;
  const totalCount = reports.length;
  const divertedTons = (resolvedCount * 0.4).toFixed(1);
  const activeCrews = totalCount > 0 ? (inProgressCount > 0 ? 18 : 4) : 0;
  const avgResponse = totalCount > 0 ? '42 min' : 'Standby';

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          City Cleanliness Dispatch & Transparency
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Public operational statistics from municipal sanitation and rapid response routes
        </p>
      </div>

      {/* Quantitative Metric Grid with Tabular Numerals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Avg Response Time</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {avgResponse}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalCount > 0 ? 'Across active municipal patrol sectors' : 'Sanitation units ready on standby'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Issues Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {resolvedCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalCount > 0
              ? `${((resolvedCount / Math.max(1, totalCount)) * 100).toFixed(0)}% resolved by municipal crews`
              : 'Clean slate: 0 pending issues in queue'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Recycled Materials Diverted</span>
            <Recycle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {divertedTons} tons
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Sorted and re-routed away from local landfills
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Active Response Units</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {activeCrews} Crews
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Equipped with GPS routing and hydraulic lift beds
          </p>
        </div>
      </div>

      {/* Reporting Guidelines & Priority Protocol */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900">
          Civic Waste Reporting Protocol
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed text-slate-600">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              Clear & Safe Evidence
            </h4>
            <p>
              Take photos from a safe distance without stepping onto roadways or touching
              hazardous containers. Include identifiable background landmarks (e.g. lamp posts,
              shopfronts, or street signs).
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              Precise Geolocation Fix
            </h4>
            <p>
              Use the "Fetch Current Location" feature on-site for sub-10 meter GPS accuracy. If
              reporting retroactively, specify the exact corner, alleyway, or civic park gate.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              Emergency Chemical Spills
            </h4>
            <p>
              For actively leaking chemical barrels, industrial cylinders, or live wire
              hazards, mark urgency as "Urgent" immediately to trigger priority rapid dispatch
              routes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
