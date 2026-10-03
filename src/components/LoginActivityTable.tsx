import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  User,
  Truck,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Sparkles,
  ArrowUpDown,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { LoginLogEntry } from '../types/audit';
import { UserRole } from '../types/auth';

interface LoginActivityTableProps {
  onRoleFilterSelect?: (role: UserRole) => void;
}

export const LoginActivityTable: React.FC<LoginActivityTableProps> = () => {
  const [logs, setLogs] = useState<LoginLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fetch logs from backend endpoint
  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/audit/login-logs');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setLogs(json.data);
          setLastRefreshed(new Date());
        }
      }
    } catch (err) {
      console.warn('Failed to fetch login logs:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Auto-poll every 12 seconds to keep audit table live
    const interval = setInterval(fetchLogs, 12000);
    return () => clearInterval(interval);
  }, []);

  // Filter logs based on search query, role, and action
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        searchQuery === '' ||
        log.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.name && log.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.ipAddress && log.ipAddress.includes(searchQuery));

      const matchesRole = roleFilter === 'all' || log.role === roleFilter;
      const matchesAction = actionFilter === 'all' || (log.action || 'login') === actionFilter;

      return matchesSearch && matchesRole && matchesAction;
    });
  }, [logs, searchQuery, roleFilter, actionFilter]);

  // CSV Export for Municipal Audit Compliance
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Email', 'Name', 'Role', 'Action', 'Timestamp', 'IP Address', 'User Agent'];
    const rows = filteredLogs.map((l) => [
      `"${l.email}"`,
      `"${l.name || ''}"`,
      `"${l.role}"`,
      `"${l.action || 'login'}"`,
      `"${new Date(l.timestamp).toISOString()}"`,
      `"${l.ipAddress || ''}"`,
      `"${(l.userAgent || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ecoclean-login-audit-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for human-readable relative time
  const getRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Role Badge Renderer
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 ring-2 ring-emerald-500/20">
            <Shield className="w-3 h-3 text-emerald-700" />
            Admin
          </span>
        );
      case 'staff':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300 ring-2 ring-sky-500/20">
            <Truck className="w-3 h-3 text-sky-700" />
            Staff
          </span>
        );
      case 'citizen':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <User className="w-3 h-3 text-slate-500" />
            Citizen
          </span>
        );
    }
  };

  // Action Badge Renderer
  const renderActionBadge = (action?: string) => {
    switch (action) {
      case 'role_switch':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <RefreshCw className="w-2.5 h-2.5" />
            Role Switch
          </span>
        );
      case 'register':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Sparkles className="w-2.5 h-2.5" />
            New Register
          </span>
        );
      case 'login':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Signed In
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Audit Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              User Audit & Login Activity Tracking
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-semibold">
              MongoDB Collection: LoginLog
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time security log tracking session logins, role switches, and municipal portal access.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh logs from MongoDB"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            title="Export CSV Audit Sheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Audit CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email, name, or IP address..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
            <span className="text-slate-400">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Sanitation Staff</option>
              <option value="citizen">Citizen</option>
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
            <span className="text-slate-400">Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="all">All Actions</option>
              <option value="login">Sign In</option>
              <option value="role_switch">Role Switch</option>
              <option value="register">Register</option>
            </select>
          </div>

          <span className="text-xs text-slate-400 ml-1">
            {filteredLogs.length} of {logs.length} events
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">User & Email</th>
                <th className="py-3 px-4">Civic Role</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Timestamp & Recency</th>
                <th className="py-3 px-4">Client IP / Device</th>
                <th className="py-3 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-emerald-600" />
                    <span>Loading audit records from MongoDB...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <span>No login activity logs match the selected filter criteria.</span>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => {
                  const logId = log.id || log._id || `log-${index}`;
                  return (
                    <tr
                      key={logId}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* User & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px]">
                            {log.name ? log.name.slice(0, 2).toUpperCase() : log.email.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block leading-tight">
                              {log.name || log.email.split('@')[0]}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {log.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        {renderRoleBadge(log.role)}
                      </td>

                      {/* Action Event */}
                      <td className="py-3 px-4">
                        {renderActionBadge(log.action)}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">
                            {new Date(log.timestamp).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded-md">
                            {getRelativeTime(log.timestamp)}
                          </span>
                        </div>
                      </td>

                      {/* Client IP & Device */}
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <span>{log.ipAddress || '127.0.0.1'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate block max-w-xs" title={log.userAgent}>
                          {log.userAgent || 'Web Client'}
                        </span>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Logged</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Audit stream active · Auto-refreshes every 12 seconds</span>
          </div>

          <div>
            Last checked: {lastRefreshed.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginActivityTable;
