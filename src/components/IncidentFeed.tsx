import React, { useState, useMemo } from 'react';
import {
  WasteReport,
  SeverityLevel,
  TimelineStep,
  ComplaintComment,
} from '../types/wasteReport';
import { AuthUser } from '../types/auth';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Trash2,
  Recycle,
  Wrench,
  Wind,
  Leaf,
  Droplets,
  MapPin,
  ChevronRight,
  X,
  ThumbsUp,
  Share2,
  MessageSquare,
  Send,
  Calendar,
  Layers,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Flame,
  ArrowUpDown,
  User,
} from 'lucide-react';

interface IncidentFeedProps {
  reports: WasteReport[];
  currentUser?: AuthUser | null;
  onOpenReportForm: () => void;
  onUpdateReport?: (updatedReport: WasteReport) => void;
}

export const IncidentFeed: React.FC<IncidentFeedProps> = ({
  reports,
  currentUser,
  onOpenReportForm,
  onUpdateReport,
}) => {
  // Filter & Search State: For citizens, default to their own private intake complaints (0 for new user)
  const [scopeFilter, setScopeFilter] = useState<'all' | 'my'>(() =>
    currentUser?.role === 'citizen' ? 'my' : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'upvotes' | 'severity'>('newest');
  const [viewLayout, setViewLayout] = useState<'cards' | 'timeline'>('cards');

  // Switch default scope to 'my' whenever a citizen logs in
  React.useEffect(() => {
    if (currentUser?.role === 'citizen') {
      setScopeFilter('my');
    } else {
      setScopeFilter('all');
    }
  }, [currentUser?.email, currentUser?.id, currentUser?.role]);

  // Modal / Detail View State
  const [selectedIncident, setSelectedIncident] = useState<WasteReport | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [showAfterPhoto, setShowAfterPhoto] = useState<boolean>(false);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);

  // Local upvote state for instant feedback across all reports
  const [upvotedMap, setUpvotedMap] = useState<{ [key: string]: boolean }>({});
  const [upvoteCountMap, setUpvoteCountMap] = useState<{ [key: string]: number }>({});

  const getUpvoteCount = (report: WasteReport) => {
    if (upvoteCountMap[report.id] !== undefined) {
      return upvoteCountMap[report.id];
    }
    return report.upvotes ?? 0;
  };

  const isUpvoted = (report: WasteReport) => {
    if (upvotedMap[report.id] !== undefined) {
      return upvotedMap[report.id];
    }
    return report.hasUpvoted ?? false;
  };

  const handleToggleUpvote = (e: React.MouseEvent, report: WasteReport) => {
    e.stopPropagation();
    const currentlyUpvoted = isUpvoted(report);
    const currentCount = getUpvoteCount(report);
    const newUpvoted = !currentlyUpvoted;
    const newCount = currentlyUpvoted ? Math.max(0, currentCount - 1) : currentCount + 1;

    setUpvotedMap((prev) => ({ ...prev, [report.id]: newUpvoted }));
    setUpvoteCountMap((prev) => ({ ...prev, [report.id]: newCount }));

    if (onUpdateReport) {
      onUpdateReport({
        ...report,
        upvotes: newCount,
        hasUpvoted: newUpvoted,
      });
    }

    if (selectedIncident && selectedIncident.id === report.id) {
      setSelectedIncident((prev) =>
        prev
          ? {
              ...prev,
              upvotes: newCount,
              hasUpvoted: newUpvoted,
            }
          : null
      );
    }
  };

  const handleCopyTicket = (ticketNumber: string) => {
    navigator.clipboard?.writeText(ticketNumber);
    setCopiedTicketId(ticketNumber);
    setTimeout(() => {
      setCopiedTicketId(null);
    }, 2500);
  };

  // Helper for category icons
  const renderCategoryIcon = (category: string, className = 'w-4 h-4') => {
    switch (category) {
      case 'overflowing_bin':
        return <Trash2 className={className} />;
      case 'illegal_dumping':
        return <AlertTriangle className={className} />;
      case 'hazardous_waste':
        return <AlertOctagon className={className} />;
      case 'broken_bin':
        return <Wrench className={className} />;
      case 'recycling_misplaced':
        return <Recycle className={className} />;
      case 'litter_hotspot':
        return <Wind className={className} />;
      case 'green_waste':
        return <Leaf className={className} />;
      case 'waterway_drain':
        return <Droplets className={className} />;
      default:
        return <Trash2 className={className} />;
    }
  };

  // Helper for glowing color-coded status badges
  const renderStatusBadge = (status: WasteReport['status']) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ring-2 ring-emerald-400/25 shadow-xs shadow-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Resolved
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 ring-2 ring-sky-400/25 shadow-xs shadow-sky-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
            In-Progress
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 ring-2 ring-indigo-400/25 shadow-xs shadow-indigo-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Assigned
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ring-2 ring-amber-400/25 shadow-xs shadow-amber-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        );
    }
  };

  // Helper for severity tags
  const renderSeverityBadge = (severity: SeverityLevel = 'low') => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
            <Flame className="w-3 h-3 text-rose-600" />
            Critical
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200/70 px-2 py-0.5 rounded-md">
            Low
          </span>
        );
    }
  };

  // Filter & Sort Logic
  const myReportsCount = useMemo(() => {
    if (!currentUser) return 0;
    const currentEmail = currentUser.email?.toLowerCase().trim();
    const currentName = currentUser.name?.toLowerCase().trim();
    return reports.filter((item) => {
      const itemEmail = item.reporterContact?.toLowerCase().trim();
      const itemName = item.reporterName?.toLowerCase().trim();
      return (currentEmail && itemEmail === currentEmail) || (currentName && itemName === currentName);
    }).length;
  }, [reports, currentUser]);

  const filteredIncidents = useMemo(() => {
    let result = reports.filter((item) => {
      const currentEmail = currentUser?.email?.toLowerCase().trim();
      const currentName = currentUser?.name?.toLowerCase().trim();
      const itemEmail = item.reporterContact?.toLowerCase().trim();
      const itemName = item.reporterName?.toLowerCase().trim();
      const isMine = Boolean(
        (currentEmail && itemEmail === currentEmail) ||
        (currentName && itemName === currentName)
      );

      const matchesScope = scopeFilter === 'all' ? true : isMine;

      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter;
      const matchesSeverity =
        severityFilter === 'all' || (item.severity || 'low') === severityFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.ticketNumber.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.address.toLowerCase().includes(q) ||
        (item.location.neighborhood || '').toLowerCase().includes(q);

      return matchesScope && matchesStatus && matchesSeverity && matchesSearch;
    });

    if (sortBy === 'upvotes') {
      result.sort((a, b) => getUpvoteCount(b) - getUpvoteCount(a));
    } else if (sortBy === 'severity') {
      const order = { critical: 3, medium: 2, low: 1 };
      result.sort(
        (a, b) =>
          (order[b.severity || 'low'] || 1) - (order[a.severity || 'low'] || 1)
      );
    }
    // 'newest' is preserved by default insertion order

    return result;
  }, [reports, scopeFilter, statusFilter, severityFilter, searchQuery, sortBy, upvoteCountMap, currentUser]);

  // Comment submit in modal
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedIncident) return;

    const newComment: ComplaintComment = {
      id: `comm-${Date.now()}`,
      author: 'Citizen Follow-up',
      role: 'citizen',
      text: newCommentText.trim(),
      time: 'Just now',
    };

    const updatedIncident: WasteReport = {
      ...selectedIncident,
      comments: [...(selectedIncident.comments || []), newComment],
    };

    setSelectedIncident(updatedIncident);
    setNewCommentText('');

    if (onUpdateReport) {
      onUpdateReport(updatedIncident);
    }
  };

  const resetAllFilters = () => {
    setStatusFilter('all');
    setSeverityFilter('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  const hasActiveFilters =
    statusFilter !== 'all' || severityFilter !== 'all' || searchQuery !== '';

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Civic Transparency & Complaint Tracking
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Incident Feed & Progress Tracker
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">
            Track real-time dispatch progress, route phase milestones, and verified
            cleanup updates across municipal complaint records.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenReportForm}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all self-start sm:self-auto"
        >
          + File Waste Report
        </button>
      </div>

      {/* TOP FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 mb-6 shadow-xs space-y-4">
        {/* Scope Toggle: My Reports vs All Incidents */}
        {currentUser && (
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <button
              type="button"
              onClick={() => setScopeFilter('my')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                scopeFilter === 'my'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>My Complaints ({myReportsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                scopeFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Community Incidents ({reports.length})</span>
            </button>
          </div>
        )}

        {/* Row 1: Search, Sort & View Mode Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket # (e.g. ECO-2026-9142), address, or landmark..."
              className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Controls: Sort and Layout Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-medium text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="upvotes">Most Upvoted / Critical</option>
                <option value="severity">Highest Severity</option>
              </select>
            </div>

            {/* Layout Mode Button Group */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setViewLayout('cards')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewLayout === 'cards'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Card Grid View"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('timeline')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewLayout === 'timeline'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Timeline Milestones View"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Status & Severity Segmented Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Status Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
              Status:
            </span>
            {[
              { id: 'all', label: 'All Incidents' },
              { id: 'pending', label: 'Pending', dot: 'bg-amber-500' },
              { id: 'in_progress', label: 'In-Progress', dot: 'bg-sky-500' },
              { id: 'resolved', label: 'Resolved', dot: 'bg-emerald-500' },
            ].map((st) => {
              const isActive = statusFilter === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {st.dot && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-white' : st.dot
                      }`}
                    />
                  )}
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>

          {/* Severity Filters */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
              Severity:
            </span>
            {[
              { id: 'all', label: 'All Levels' },
              { id: 'low', label: 'Low' },
              { id: 'medium', label: 'Medium' },
              { id: 'critical', label: 'Critical' },
            ].map((sev) => {
              const isActive = severityFilter === sev.id;
              return (
                <button
                  key={sev.id}
                  type="button"
                  onClick={() => setSeverityFilter(sev.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {sev.label}
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline whitespace-nowrap ml-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MATCH COUNT & SUMMARY */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-1">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-800 font-mono tabular-nums">
            {filteredIncidents.length}
          </span>{' '}
          active complaints
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Resolved
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500" /> In-Progress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Pending
          </span>
        </div>
      </div>

      {/* COMPLAINTS LIST / CARDS */}
      {filteredIncidents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          {scopeFilter === 'my' && myReportsCount === 0 ? (
            <>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                You have 0 reported waste complaints
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Welcome! You have a clean slate with zero filed complaints. Notice an overflowing bin, illegal dumping, or street hazard? Submit a report with live photo verification.
              </p>
              <button
                type="button"
                onClick={onOpenReportForm}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                + File Your First Report
              </button>
            </>
          ) : reports.length === 0 ? (
            <>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Zero Complaints in System (0 Data)
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                All municipal sectors are currently clean and free of pending waste complaints.
              </p>
              <button
                type="button"
                onClick={onOpenReportForm}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                + Report an Issue
              </button>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">
                No complaints match your filters
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Try adjusting your search keywords, status filter, or severity options.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold rounded-xl border border-emerald-200 transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div
          className={
            viewLayout === 'cards'
              ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
              : 'space-y-4'
          }
        >
          {filteredIncidents.map((incident) => {
            const upvotes = getUpvoteCount(incident);
            const userUpvoted = isUpvoted(incident);
            const timelineSteps = incident.timeline || [];
            const completedCount = timelineSteps.filter((s) => s.completed).length;

            return (
              <div
                key={incident.id}
                onClick={() => {
                  setSelectedIncident(incident);
                  setActivePhotoIndex(0);
                  setShowAfterPhoto(false);
                }}
                className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Top Bar on Card: Ticket #, glowing status badge, severity badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
                        {incident.ticketNumber}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyTicket(incident.ticketNumber);
                        }}
                        className="text-slate-400 hover:text-slate-600 text-xs p-1"
                        title="Copy Ticket ID"
                      >
                        {copiedTicketId === incident.ticketNumber ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {renderSeverityBadge(incident.severity)}
                      {renderStatusBadge(incident.status)}
                    </div>
                  </div>

                  {/* Category & Thumbnail preview */}
                  <div className="flex items-start gap-3 mb-3">
                    {incident.images.length > 0 ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <img
                          src={incident.images[0].url}
                          alt="Incident evidence"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        {incident.images.length > 1 && (
                          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-mono px-1 rounded-sm">
                            +{incident.images.length - 1}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-emerald-50 text-emerald-700 shrink-0 border border-emerald-100 flex items-center justify-center">
                        {renderCategoryIcon(incident.category, 'w-6 h-6')}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {incident.categoryLabel}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                        {incident.description}
                      </p>
                    </div>
                  </div>

                  {/* Location snippet */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{incident.location.address}</span>
                  </div>

                  {/* Progress Milestone Bar */}
                  {timelineSteps.length > 0 && (
                    <div className="mb-4 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                        <span className="font-medium text-slate-600">
                          Route Phase ({completedCount}/{timelineSteps.length})
                        </span>
                        <span className="font-mono text-emerald-700 font-semibold">
                          {incident.status === 'resolved'
                            ? '100% Cleared'
                            : incident.status === 'in_progress'
                            ? 'Crew Deployed'
                            : 'Intake Queued'}
                        </span>
                      </div>

                      {/* Micro Progress Bar */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {timelineSteps.map((step, idx) => (
                          <div
                            key={step.phase}
                            className={`h-1.5 rounded-full transition-all ${
                              step.completed
                                ? 'bg-emerald-600'
                                : step.current
                                ? 'bg-sky-500 animate-pulse'
                                : 'bg-slate-200'
                            }`}
                            title={`${step.title}: ${step.completed ? 'Completed' : 'Pending'}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Metadata, Upvote, and View Detail Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono">
                      {incident.submittedAt}
                    </span>
                    {incident.assignedCrew && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate max-w-[130px] hidden sm:inline text-slate-600">
                          {incident.assignedCrew}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Upvote / Me Too Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleUpvote(e, incident)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        userUpvoted
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                      title="Confirm this incident affects you too"
                    >
                      <ThumbsUp
                        className={`w-3.5 h-3.5 ${
                          userUpvoted ? 'text-emerald-700 fill-emerald-600' : ''
                        }`}
                      />
                      <span className="font-mono tabular-nums">{upvotes}</span>
                    </button>

                    {/* View Details link */}
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 group-hover:translate-x-0.5 transition-transform">
                      <span>Track</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL: Location Coordinates, Uploaded Photo Preview, & Interactive Timeline */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  {renderCategoryIcon(selectedIncident.category, 'w-5 h-5')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {selectedIncident.ticketNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyTicket(selectedIncident.ticketNumber)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {copiedTicketId === selectedIncident.ticketNumber ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    {renderSeverityBadge(selectedIncident.severity)}
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    {selectedIncident.categoryLabel}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {renderStatusBadge(selectedIncident.status)}
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* SECTION: Evidence Photos Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Visual Evidence & Verification
                  </span>
                  {selectedIncident.afterPhotoUrl && (
                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => setShowAfterPhoto(false)}
                        className={`px-2 py-0.5 rounded-md ${
                          !showAfterPhoto
                            ? 'bg-white font-semibold text-slate-800 shadow-xs'
                            : 'text-slate-500'
                        }`}
                      >
                        Reported Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAfterPhoto(true)}
                        className={`px-2 py-0.5 rounded-md ${
                          showAfterPhoto
                            ? 'bg-emerald-600 font-semibold text-white shadow-xs'
                            : 'text-emerald-700'
                        }`}
                      >
                        After Cleanup Fix
                      </button>
                    </div>
                  )}
                </div>

                {showAfterPhoto && selectedIncident.afterPhotoUrl ? (
                  <div className="rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50 h-56 relative">
                    <img
                      src={selectedIncident.afterPhotoUrl}
                      alt="Verified cleanup"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-700 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Site Resolved
                    </div>
                  </div>
                ) : selectedIncident.images.length > 0 ? (
                  <div className="space-y-2">
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-56 relative shadow-inner">
                      <img
                        src={selectedIncident.images[activePhotoIndex]?.url}
                        alt="Evidence main"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-xs font-mono">
                        {selectedIncident.images[activePhotoIndex]?.name} ·{' '}
                        {selectedIncident.images[activePhotoIndex]?.size}
                      </div>
                    </div>

                    {selectedIncident.images.length > 1 && (
                      <div className="flex gap-2">
                        {selectedIncident.images.map((img, idx) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => setActivePhotoIndex(idx)}
                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                              activePhotoIndex === idx
                                ? 'border-emerald-600 scale-102 ring-2 ring-emerald-500/20'
                                : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={img.url}
                              alt={img.name}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 bg-slate-50">
                    No citizen photos attached for this report.
                  </div>
                )}
              </div>

              {/* SECTION: Description */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Incident Description
                </span>
                <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                  "{selectedIncident.description}"
                </p>
              </div>

              {/* SECTION: Location Coordinates & Visual Widget */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    GPS Coordinates & Incident Site
                  </span>
                  {selectedIncident.location.lat && (
                    <button
                      type="button"
                      onClick={() => {
                        const coords = `${selectedIncident.location.lat}, ${selectedIncident.location.lng}`;
                        navigator.clipboard?.writeText(coords);
                        setCopiedTicketId('coords');
                        setTimeout(() => setCopiedTicketId(null), 2000);
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
                    >
                      {copiedTicketId === 'coords' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied GPS</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Coords</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">
                      {selectedIncident.location.address}
                    </span>
                    <span className="text-xs text-slate-500">
                      Sector:{' '}
                      {selectedIncident.location.neighborhood || 'Municipal Metro Corridor'}
                    </span>
                  </div>
                </div>

                {/* Tabular Coordinates & Precision */}
                {selectedIncident.location.lat && (
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block font-sans uppercase">
                        Latitude
                      </span>
                      <span className="font-semibold text-slate-800">
                        {selectedIncident.location.lat.toFixed(6)}° N
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block font-sans uppercase">
                        Longitude
                      </span>
                      <span className="font-semibold text-slate-800">
                        {selectedIncident.location.lng?.toFixed(6)}° W
                      </span>
                    </div>
                  </div>
                )}

                {selectedIncident.location.manualNotes && (
                  <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60">
                    <span className="font-semibold text-slate-700">Landmark Placement:</span>{' '}
                    {selectedIncident.location.manualNotes}
                  </div>
                )}
              </div>

              {/* SECTION: INTERACTIVE PROGRESS TIMELINE */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Complaint Progress Timeline
                  </span>
                  <span className="text-xs text-emerald-700 font-medium">
                    {selectedIncident.assignedCrew || 'Municipal Route Dispatch'}
                  </span>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {selectedIncident.timeline?.map((step: TimelineStep, i: number) => {
                    return (
                      <div key={step.phase} className="relative">
                        {/* Timeline Step Icon Dot */}
                        <div
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white transition-all ${
                            step.completed
                              ? 'bg-emerald-600 ring-4 ring-emerald-100'
                              : step.current
                              ? 'bg-sky-500 ring-4 ring-sky-100 animate-pulse'
                              : 'bg-slate-300 ring-2 ring-slate-100'
                          }`}
                        >
                          {step.completed ? (
                            <Check className="w-3 h-3 stroke-[3]" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>

                        {/* Timeline Step Info */}
                        <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/80">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {step.title}
                            </span>
                            {step.timestamp && (
                              <span className="text-[11px] font-mono text-slate-400">
                                {step.timestamp}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {step.description}
                          </p>
                          {step.actor && (
                            <div className="mt-1.5 text-[10px] text-slate-400">
                              Logged by: <span className="font-medium text-slate-600">{step.actor}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION: Citizen Community Updates & Comments */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Field Dispatch Notes & Citizen Feedback
                </span>

                <div className="space-y-2">
                  {selectedIncident.comments && selectedIncident.comments.length > 0 ? (
                    selectedIncident.comments.map((c) => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl text-xs ${
                          c.role === 'official'
                            ? 'bg-emerald-50/80 border border-emerald-200/70 text-emerald-950'
                            : 'bg-slate-50 border border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold flex items-center gap-1.5">
                            {c.author}
                            {c.role === 'official' && (
                              <span className="bg-emerald-200 text-emerald-800 text-[10px] px-1.5 rounded-md font-sans">
                                Official
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {c.time}
                          </span>
                        </div>
                        <p className="leading-relaxed">{c.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic py-1">
                      No citizen notes yet. Add an update below.
                    </div>
                  )}
                </div>

                {/* Add Note Input Form */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Add an update (e.g. 'Bin lid has been replaced', 'Trash cleared')..."
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Note</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Modal Action Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={(e) => handleToggleUpvote(e, selectedIncident)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isUpvoted(selectedIncident)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>
                  {isUpvoted(selectedIncident) ? 'Confirmed (+1)' : 'Confirm Issue'}
                </span>
                <span className="font-mono tabular-nums">
                  ({getUpvoteCount(selectedIncident)})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
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

export default IncidentFeed;
