import React, { useState, useMemo } from 'react';
import {
  WasteReport,
  SeverityLevel,
} from '../types/wasteReport';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  AlertCircle,
  CheckCircle2,
  Users,
  Clock,
  MapPin,
  Map as MapIcon,
  Filter,
  Search,
  ChevronDown,
  ArrowUpDown,
  Download,
  Shield,
  Truck,
  Eye,
  X,
  ExternalLink,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Check,
  Building,
  Layers,
  Flame,
  Radio,
  Activity,
  RotateCcw,
} from 'lucide-react';
import { LoginActivityTable } from './LoginActivityTable';

interface AdminDashboardProps {
  reports: WasteReport[];
  onUpdateReport: (updatedReport: WasteReport) => void;
  onOpenReportForm?: () => void;
  onClearAllReports?: () => void;
}

const MUNICIPAL_STAFF_CREWS = [
  'Zone 2 Rapid Clean Unit',
  'Heavy Haul Municipal Logistics',
  'Hardware & Infrastructure Depot',
  'Waterway Rapid Surface Skimmer Unit',
  'District Greens Sweeper Team',
  'Specialist Hazmat Unit 7',
  'Inspector Dave Miller',
  'Crew Lead Sarah Jenkins',
  'Unassigned',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  reports,
  onUpdateReport,
  onOpenReportForm,
  onClearAllReports,
}) => {
  // Navigation / Sidebar tab
  const [activeNav, setActiveNav] = useState<'queue' | 'map' | 'crews' | 'analytics'>('queue');
  const [activeSection, setActiveSection] = useState<'queue' | 'activity'>('queue');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');

  // Map Preview Toggle
  const [showMapPreview, setShowMapPreview] = useState<boolean>(false);
  const [selectedMapPin, setSelectedMapPin] = useState<WasteReport | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState<boolean>(false);

  // Detail Modal
  const [inspectReport, setInspectReport] = useState<WasteReport | null>(null);

  // Quick action feedback
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFlashMessage(msg);
    setTimeout(() => setFlashMessage(null), 3000);
  };

  // Top Metrics Calculation
  const totalComplaints = reports.length;
  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const assignedCount = reports.filter((r) => r.status === 'assigned').length;
  const inProgressCount = reports.filter((r) => r.status === 'in_progress').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;
  const activeWorkersCount = 24; // 24 active personnel across 8 field vehicles

  // Status Change Handler
  const handleStatusChange = (
    report: WasteReport,
    newStatus: 'pending' | 'assigned' | 'in_progress' | 'resolved'
  ) => {
    let updatedTimeline = [...(report.timeline || [])];

    if (newStatus === 'assigned') {
      updatedTimeline = updatedTimeline.map((step) =>
        step.phase === 'dispatched'
          ? { ...step, completed: true, timestamp: 'Assigned Just now' }
          : step
      );
    } else if (newStatus === 'in_progress') {
      updatedTimeline = updatedTimeline.map((step) =>
        step.phase === 'on_site'
          ? { ...step, current: true, timestamp: 'In Progress' }
          : step
      );
    } else if (newStatus === 'resolved') {
      updatedTimeline = updatedTimeline.map((step) => ({
        ...step,
        completed: true,
        current: false,
        timestamp: step.timestamp || 'Completed',
      }));
    }

    const updated: WasteReport = {
      ...report,
      status: newStatus,
      timeline: updatedTimeline,
      resolutionEstimate:
        newStatus === 'resolved'
          ? 'Completed and site cleared'
          : report.resolutionEstimate,
    };

    onUpdateReport(updated);
    showToast(`Updated ${report.ticketNumber} to ${newStatus.replace('_', ' ').toUpperCase()}`);

    if (inspectReport && inspectReport.id === report.id) {
      setInspectReport(updated);
    }
  };

  // Staff Assignment Handler
  const handleStaffChange = (report: WasteReport, newCrew: string) => {
    const isNowAssigned = newCrew !== 'Unassigned';
    const nextStatus =
      report.status === 'pending' && isNowAssigned ? 'assigned' : report.status;

    const updated: WasteReport = {
      ...report,
      assignedCrew: isNowAssigned ? newCrew : undefined,
      status: nextStatus,
    };

    onUpdateReport(updated);
    showToast(`Assigned ${report.ticketNumber} to ${newCrew}`);

    if (inspectReport && inspectReport.id === report.id) {
      setInspectReport(updated);
    }
  };

  // Filtered reports for table
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const matchStatus =
        statusFilter === 'all' || item.status === statusFilter;
      const matchSeverity =
        severityFilter === 'all' || (item.severity || 'low') === severityFilter;
      const matchCrew =
        assignedFilter === 'all' ||
        (assignedFilter === 'unassigned'
          ? !item.assignedCrew || item.assignedCrew === 'Unassigned'
          : item.assignedCrew === assignedFilter);

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.ticketNumber.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.location.address.toLowerCase().includes(q) ||
        (item.assignedCrew || '').toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);

      return matchStatus && matchSeverity && matchCrew && matchSearch;
    });
  }, [reports, statusFilter, severityFilter, assignedFilter, searchQuery]);

  // Export CSV generator (client-side)
  const handleExportCSV = () => {
    const headers = ['Ticket', 'Category', 'Status', 'Severity', 'Address', 'AssignedCrew', 'SubmittedAt'];
    const rows = filteredReports.map((r) => [
      r.ticketNumber,
      `"${r.categoryLabel}"`,
      r.status,
      r.severity || 'low',
      `"${r.location.address.replace(/"/g, '""')}"`,
      `"${r.assignedCrew || 'Unassigned'}"`,
      r.submittedAt,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ecoclean_complaints_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV dispatch report');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Flash Toast Notification */}
      {flashMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs border border-emerald-500/40 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{flashMessage}</span>
        </div>
      )}

      {/* ADMIN HEADER & CONTROL BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              Civic Operations Command
            </span>
            <span className="text-xs text-slate-400 font-mono">Live Municipal Dispatch</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Sanitation Administration & Fleet Dispatch
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowMapPreview(!showMapPreview)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showMapPreview
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>{showMapPreview ? 'Hide Dispatch Map' : 'Map Preview'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Download CSV report for municipal audit"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {onClearAllReports && (
            isConfirmingClear ? (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 rounded-xl p-1 animate-in fade-in">
                <span className="text-[11px] font-semibold text-rose-800 px-1">
                  Wipe all to 0?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClearAllReports();
                    setIsConfirmingClear(false);
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Yes, Clear (0)
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingClear(false)}
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                title="Wipe database complaints and start clean with 0 data"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Data to 0</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs: Dispatch Queue vs Login Activity Audit */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveSection('queue')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'queue'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Dispatch Queue</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeSection === 'queue'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {reports.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('activity')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'activity'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Login Activity</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono ${
              activeSection === 'activity'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}
          >
            Audit Logs
          </span>
        </button>
      </div>

      {activeSection === 'activity' ? (
        <LoginActivityTable />
      ) : (
        <>
          {/* TOP STAT CARDS (With +15% Green Indicators & Icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Complaints */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Complaints
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {totalComplaints}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="inline-flex items-center font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +15%
            </span>
            <span className="text-slate-400">vs last 7-day intake</span>
          </div>
        </div>

        {/* Card 2: Pending Issues */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Pending Issues
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {pendingCount}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="inline-flex items-center font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
              <Clock className="w-3 h-3 mr-0.5" />
              {assignedCount} Assigned
            </span>
            <span className="text-slate-400">awaiting route clearance</span>
          </div>
        </div>

        {/* Card 3: Resolved Today */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Resolved Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-800 font-mono tabular-nums">
            {resolvedCount}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="inline-flex items-center font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +28%
            </span>
            <span className="text-slate-400">route efficiency score</span>
          </div>
        </div>

        {/* Card 4: Active Workers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Workers & Crews
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200/60">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {activeWorkersCount} Staff
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="inline-flex items-center font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              <Truck className="w-3 h-3 mr-0.5" />
              8 Units
            </span>
            <span className="text-slate-400">deployed in patrol sectors</span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE MAP PREVIEW (Toggled via button) */}
      {showMapPreview && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs animate-in fade-in duration-200">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Civic GIS Dispatch Map (Live Pins)
              </span>
              <span className="text-xs text-slate-400">
                · {filteredReports.length} geolocated incidents
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Critical
              </span>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pending
              </span>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> In-Progress
              </span>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Resolved
              </span>
            </div>
          </div>

          {/* Map Canvas Graphic */}
          <div className="relative h-80 bg-slate-900 overflow-hidden select-none">
            {/* Grid & Street Network Simulation */}
            <svg
              className="absolute inset-0 w-full h-full opacity-40"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="grid-pattern"
                  width="60"
                  height="60"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 60 0 L 0 0 0 60"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  <circle cx="0" cy="0" r="1.5" fill="#475569" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="#0f172a" />
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />
              {/* Arterial roads */}
              <line x1="0" y1="120" x2="100%" y2="140" stroke="#475569" strokeWidth="4" />
              <line x1="180" y1="0" x2="320" y2="100%" stroke="#475569" strokeWidth="3" />
              <line x1="450" y1="0" x2="600" y2="100%" stroke="#1e293b" strokeWidth="5" />
              <path
                d="M 0,220 Q 300,180 700,260 T 1200,200"
                fill="none"
                stroke="#0284c7"
                strokeWidth="8"
                opacity="0.6"
              />
            </svg>

            {/* Simulated Waterway Label */}
            <div className="absolute bottom-4 left-6 text-sky-400/80 text-[10px] font-mono tracking-widest uppercase">
              Municipal Canal & Drainage Basin
            </div>

            {/* Clickable Map Pins for Reports */}
            {filteredReports.map((rep, idx) => {
              // Distribute pins pleasantly across map canvas using coords modulo
              const leftPercent = 15 + ((idx * 22 + (rep.location.lng || 0) * 10000) % 70);
              const topPercent = 20 + ((idx * 28 + (rep.location.lat || 0) * 10000) % 60);

              const pinColor =
                rep.status === 'resolved'
                  ? 'bg-emerald-500 text-white border-emerald-300'
                  : rep.status === 'in_progress'
                  ? 'bg-sky-500 text-white border-sky-300'
                  : rep.severity === 'critical'
                  ? 'bg-rose-500 text-white border-rose-300'
                  : 'bg-amber-500 text-white border-amber-300';

              const isSelected = selectedMapPin?.id === rep.id;

              return (
                <div
                  key={rep.id}
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                  onClick={() => setSelectedMapPin(rep)}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-lg transition-transform ${pinColor} ${
                      isSelected ? 'scale-125 ring-4 ring-white/50' : 'group-hover:scale-110'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <span className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 -top-7 bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded whitespace-nowrap shadow-md z-30">
                    {rep.ticketNumber} · {rep.categoryLabel}
                  </span>
                </div>
              );
            })}

            {/* Selected Map Pin Inspector Card Overlay */}
            {selectedMapPin && (
              <div className="absolute top-4 right-4 z-30 bg-white/95 backdrop-blur-md rounded-xl p-3.5 border border-slate-200 shadow-xl max-w-xs text-xs text-slate-800 animate-in fade-in">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-emerald-800">
                    {selectedMapPin.ticketNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedMapPin(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
                <h4 className="font-bold text-slate-900 mb-1">{selectedMapPin.categoryLabel}</h4>
                <p className="text-[11px] text-slate-500 mb-2 line-clamp-2">
                  {selectedMapPin.description}
                </p>
                <div className="text-[11px] text-slate-600 mb-3 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{selectedMapPin.location.address}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectReport(selectedMapPin)}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] text-center"
                >
                  Open Incident Record
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FILTER & DISPATCH CONTROLS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket, category, address, or crew..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="all">All ({reports.length})</option>
              <option value="pending">Pending ({pendingCount})</option>
              <option value="assigned">Assigned ({assignedCount})</option>
              <option value="in_progress">In-Progress ({inProgressCount})</option>
              <option value="resolved">Resolved ({resolvedCount})</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
            <span className="text-slate-400">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Staff Crew Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
            <span className="text-slate-400">Crew:</span>
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-hidden cursor-pointer max-w-[140px] truncate"
            >
              <option value="all">All Crews</option>
              <option value="unassigned">Unassigned Only</option>
              {MUNICIPAL_STAFF_CREWS.filter((c) => c !== 'Unassigned').map((crew) => (
                <option key={crew} value={crew}>
                  {crew}
                </option>
              ))}
            </select>
          </div>

          {(statusFilter !== 'all' || severityFilter !== 'all' || assignedFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setSeverityFilter('all');
                setAssignedFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* DATA TABLE LISTING ALL REPORTED ISSUES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 font-sans">Ticket & Intake</th>
                <th className="py-3.5 px-4 font-sans">Category & Severity</th>
                <th className="py-3.5 px-4 font-sans">Location / Landmark</th>
                <th className="py-3.5 px-4 font-sans">
                  Status <span className="text-emerald-600 font-normal">(Instant Update)</span>
                </th>
                <th className="py-3.5 px-4 font-sans">
                  Staff Assignment <span className="text-emerald-600 font-normal">(Crew)</span>
                </th>
                <th className="py-3.5 px-4 font-sans text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {reports.length === 0
                      ? 'Dispatch queue is clear with 0 complaints. Starting clean slate.'
                      : 'No complaints match your current administrative filters.'}
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Ticket & Intake */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {report.ticketNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {report.submittedAt} · {report.reporterName || 'Citizen'}
                        </div>
                      </td>

                      {/* Category & Severity */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {report.categoryLabel}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          {report.severity === 'critical' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200">
                              <Flame className="w-2.5 h-2.5" /> Critical
                            </span>
                          ) : report.severity === 'medium' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200">
                              Moderate
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200">
                              Routine
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="flex items-center gap-1 text-slate-800 truncate font-medium">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{report.location.address}</span>
                        </div>
                        {report.location.lat && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 pl-4.5">
                            {report.location.lat.toFixed(4)}°, {report.location.lng?.toFixed(4)}°
                          </div>
                        )}
                      </td>

                      {/* DROPDOWN SELECTOR: INSTANT STATUS UPDATE */}
                      <td className="py-3.5 px-4">
                        <div className="relative inline-block w-36">
                          <select
                            value={report.status}
                            onChange={(e) =>
                              handleStatusChange(report, e.target.value as any)
                            }
                            className={`w-full py-1.5 pl-2.5 pr-6 rounded-lg text-xs font-semibold appearance-none border cursor-pointer transition-all ${
                              report.status === 'resolved'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/20'
                                : report.status === 'in_progress'
                                ? 'bg-sky-50 text-sky-800 border-sky-300 ring-1 ring-sky-400/20'
                                : report.status === 'assigned'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400/20'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="assigned">Assigned</option>
                            <option value="in_progress">In-Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                        </div>
                      </td>

                      {/* STAFF ASSIGNMENT DROPDOWN */}
                      <td className="py-3.5 px-4">
                        <div className="relative inline-block w-44">
                          <select
                            value={report.assignedCrew || 'Unassigned'}
                            onChange={(e) => handleStaffChange(report, e.target.value)}
                            className="w-full py-1.5 pl-2.5 pr-6 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-800 appearance-none hover:border-emerald-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 cursor-pointer truncate"
                          >
                            {MUNICIPAL_STAFF_CREWS.map((crew) => (
                              <option key={crew} value={crew}>
                                {crew}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectReport(report)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 rounded-lg transition-colors"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Showing <span className="font-semibold text-slate-800">{filteredReports.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{reports.length}</span> municipal reports
          </div>
          <div className="text-[11px] text-slate-400">
            Auto-dispatched with Municipal Route Algorithm v2.4
          </div>
        </div>
      </div>
      </>
      )}

      {/* DETAIL MODAL FROM INSPECT BUTTON */}
      {inspectReport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-800 block">
                  {inspectReport.ticketNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {inspectReport.categoryLabel}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectReport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Evidence Photo */}
              {inspectReport.images.length > 0 && (
                <div className="rounded-xl overflow-hidden border border-slate-200 h-48 bg-slate-100">
                  <img
                    src={inspectReport.images[0].url}
                    alt="Inspection evidence"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Status and Crew Controls in Modal */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block mb-1">
                    Update Status
                  </span>
                  <select
                    value={inspectReport.status}
                    onChange={(e) =>
                      handleStatusChange(inspectReport, e.target.value as any)
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                  >
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In-Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block mb-1">
                    Assign Crew Unit
                  </span>
                  <select
                    value={inspectReport.assignedCrew || 'Unassigned'}
                    onChange={(e) => handleStaffChange(inspectReport, e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-xs truncate"
                  >
                    {MUNICIPAL_STAFF_CREWS.map((crew) => (
                      <option key={crew} value={crew}>
                        {crew}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <span className="font-semibold text-slate-400 uppercase text-[10px] block mb-1">
                  Citizen Description
                </span>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-800">
                  {inspectReport.description}
                </p>
              </div>

              {/* Location details */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-semibold text-slate-400 uppercase text-[10px] block">
                  Location & Coordinates
                </span>
                <div className="font-medium text-slate-900">{inspectReport.location.address}</div>
                {inspectReport.location.lat && (
                  <div className="font-mono text-slate-500">
                    GPS: {inspectReport.location.lat.toFixed(6)}° N,{' '}
                    {inspectReport.location.lng?.toFixed(6)}° W
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectReport(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold text-xs transition-colors"
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

export default AdminDashboard;
