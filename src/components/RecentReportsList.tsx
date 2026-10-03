import React, { useState } from 'react';
import {
  WasteReport,
  IssueCategory,
} from '../types/wasteReport';
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  Eye,
  X,
} from 'lucide-react';
import { WASTE_CATEGORIES } from '../data/mockWasteData';

interface RecentReportsListProps {
  reports: WasteReport[];
  onOpenReportForm: () => void;
}

export const RecentReportsList: React.FC<RecentReportsListProps> = ({
  reports,
  onOpenReportForm,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);

  const filteredReports = reports.filter((rep) => {
    const matchesStatus =
      filterStatus === 'all' || rep.status === filterStatus;
    const matchesSearch =
      rep.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Community Waste Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time civic transparency stream across municipal districts
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenReportForm}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all self-start sm:self-auto"
        >
          + File New Waste Report
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Interactive Segmented Filter (Allowed functional buttons) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {[
            { id: 'all', label: 'All Incidents' },
            { id: 'pending', label: 'Pending Dispatch' },
            { id: 'in_progress', label: 'In Cleanup' },
            { id: 'resolved', label: 'Resolved' },
          ].map((item) => {
            const isActive = filterStatus === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilterStatus(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search address, ticket number, or keyword..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
          />
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Filter className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            No waste reports matching filters
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Try adjusting your search criteria or report a new incident.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterStatus('all');
              setSearchQuery('');
            }}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md p-4 sm:p-5 transition-all duration-200 cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  {report.images.length > 0 ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80">
                      <img
                        src={report.images[0].url}
                        alt="Evidence thumbnail"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-emerald-50 text-emerald-700 shrink-0 border border-emerald-100 flex items-center justify-center">
                      <MapPin className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    {/* Header line with ticket and clean unboxed metadata (anti-slop) */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-mono font-semibold text-emerald-800">
                        {report.ticketNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{report.status.replace('_', ' ')}</span>
                      <span aria-hidden="true">·</span>
                      <span>{report.submittedAt}</span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {report.categoryLabel}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                      {report.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{report.location.address}</span>
                      {report.location.lat && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums text-slate-400">
                            {report.location.lat.toFixed(4)}°, {report.location.lng?.toFixed(4)}°
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="text-xs text-slate-500">
                    <span className="capitalize font-medium text-slate-700">
                      {report.urgency} Urgency
                    </span>
                  </div>
                  <div className="text-xs text-emerald-700 font-medium inline-flex items-center gap-1 sm:mt-2">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Report Detail View */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-semibold text-emerald-700 block">
                  {selectedReport.ticketNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedReport.categoryLabel}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Photo preview */}
              {selectedReport.images.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Evidence Photos
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedReport.images.map((img) => (
                      <div
                        key={img.id}
                        className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-36"
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Citizen Description
                </span>
                <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {selectedReport.description}
                </p>
              </div>

              {/* Location details */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Location Fix
                </span>
                <div className="flex items-start gap-2 text-sm font-semibold text-slate-800">
                  <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{selectedReport.location.address}</span>
                </div>
                {selectedReport.location.manualNotes && (
                  <p className="text-xs text-slate-500 mt-1 pl-6">
                    Note: {selectedReport.location.manualNotes}
                  </p>
                )}
                {selectedReport.location.lat && (
                  <p className="text-xs font-mono text-slate-400 mt-1 pl-6">
                    Coordinates: {selectedReport.location.lat.toFixed(6)}° N,{' '}
                    {selectedReport.location.lng?.toFixed(6)}° W
                  </p>
                )}
              </div>

              {/* Dispatch Info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Assigned Service Crew</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReport.assignedCrew || 'Municipal Route Dispatch'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Estimated Cleanup</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReport.resolutionEstimate || 'Target within 24h'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
