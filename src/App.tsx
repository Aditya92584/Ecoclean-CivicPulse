/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { ReportIssue } from './components/ReportIssue';
import { IncidentFeed } from './components/IncidentFeed';
import { RealTimeWasteMap } from './components/RealTimeWasteMap';
import { AdminDashboard } from './components/AdminDashboard';
import { CivicImpactMetrics } from './components/CivicImpactMetrics';
import { LoginModal } from './components/LoginModal';
import { WasteReport } from './types/wasteReport';
import { AuthUser, UserRole, DEMO_USERS } from './types/auth';
import { INITIAL_COMMUNITY_REPORTS } from './data/mockWasteData';
import { CheckCircle2 } from 'lucide-react';

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyBh5OhOKwgyuTOhsNigm4P4aGA3s17xiow';

export default function App() {
  // Authentication State: Starts as guest/visitor if not logged in
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('ecoclean_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [initialModalRole, setInitialModalRole] = useState<UserRole>('citizen');

  // Default starting screen/tab of the app set to 'home'
  const [activeTab, setActiveTab] = useState<
    'home' | 'report' | 'feed' | 'map' | 'admin' | 'impact'
  >('home');
  // Starts with clean slate (0 complaints) for new users
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync real issues from backend Express API on mount
  useEffect(() => {
    fetch('/api/issues')
      .then((res) => {
        if (!res.ok) throw new Error('API not available');
        return res.json();
      })
      .then((data) => {
        if (data && data.success && Array.isArray(data.data)) {
          setReports(data.data);
        }
      })
      .catch(() => {
        setReports([]);
      });
  }, []);

  const logAuditActivity = async (
    email: string,
    role: UserRole,
    name?: string,
    action: 'login' | 'role_switch' | 'register' = 'login'
  ) => {
    try {
      await fetch('/api/audit/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, name, action }),
      });
    } catch {
      // Retain optimistic client session
    }
  };

  const handleLoginSuccess = (
    user: AuthUser,
    action: 'login' | 'role_switch' | 'register' = 'login'
  ) => {
    setCurrentUser(user);
    localStorage.setItem('ecoclean_user', JSON.stringify(user));
    setToastMessage(`Welcome back, ${user.name} (${user.role.toUpperCase()})`);

    // Store in MongoDB collection (LoginLog)
    logAuditActivity(user.email, user.role, user.name, action);

    // Switch view according to user role requirements
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else if (user.role === 'citizen') {
      setActiveTab('feed');
    } else {
      setActiveTab('feed');
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ecoclean_user');
    setActiveTab('home');
    setToastMessage('Signed out. Switched to public guest mode.');
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenLogin = (role?: UserRole) => {
    if (role) setInitialModalRole(role);
    setIsLoginModalOpen(true);
  };

  // Isolate personal complaints filed by the currently logged-in user
  const myCitizenReports = useMemo(() => {
    if (!currentUser) return [];
    const currentEmail = currentUser.email?.toLowerCase().trim();
    const currentName = currentUser.name?.toLowerCase().trim();
    return reports.filter((item) => {
      const itemEmail = item.reporterContact?.toLowerCase().trim();
      const itemName = item.reporterName?.toLowerCase().trim();
      return (currentEmail && itemEmail === currentEmail) || (currentName && itemName === currentName);
    });
  }, [reports, currentUser]);

  const handleReportSubmitted = async (newReport: WasteReport) => {
    // Explicitly stamp current authenticated user's credentials on the report
    const stampedReport: WasteReport = {
      ...newReport,
      reporterName: currentUser?.name || newReport.reporterName || 'Citizen User',
      reporterContact: currentUser?.email || newReport.reporterContact,
    };

    // Optimistic UI update
    setReports((prev) => [stampedReport, ...prev]);
    setActiveTab('feed');
    setToastMessage(`Report ${stampedReport.ticketNumber} logged in your personal account.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);

    // Call POST /api/issues
    try {
      await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: stampedReport.category,
          categoryLabel: stampedReport.categoryLabel,
          severity: stampedReport.severity,
          urgency: stampedReport.urgency,
          description: stampedReport.description,
          location: stampedReport.location,
          photo: stampedReport.images.length > 0 ? stampedReport.images[0].url : null,
          images: stampedReport.images,
          reporterName: stampedReport.reporterName,
          reporterContact: stampedReport.reporterContact,
          notifyUpdates: stampedReport.notifyUpdates,
        }),
      });
    } catch {
      // Retain optimistic state
    }
  };

  const handleUpdateReport = async (updatedReport: WasteReport) => {
    // Optimistic UI update
    setReports((prev) =>
      prev.map((r) => (r.id === updatedReport.id ? updatedReport : r))
    );

    // Call PATCH /api/issues/:id
    try {
      await fetch(`/api/issues/${updatedReport.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updatedReport.status,
          assignedWorker: updatedReport.assignedCrew,
          assignedCrew: updatedReport.assignedCrew,
          severity: updatedReport.severity,
          resolutionEstimate: updatedReport.resolutionEstimate,
        }),
      });
    } catch {
      // Retain optimistic state
    }
  };

  const handleClearAllReports = async () => {
    try {
      await fetch('/api/issues/clear', { method: 'DELETE' });
    } catch {
      // offline fallback
    }
    setReports([]);
    setToastMessage('All complaints cleared to zero. Clean slate active.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'geocoding', 'places']}>
      <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-slate-900">
        {/* Top Bar Navigation (includes Home tab) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reportCount={reports.length}
        myReportCount={myCitizenReports.length}
        currentUser={currentUser}
        onOpenLoginModal={handleOpenLogin}
        onLogout={handleLogout}
      />

      {/* Role Notice & Instant Switcher Bar */}
      <div className="bg-emerald-950 text-white py-1.5 px-4 text-xs border-b border-emerald-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-200">Session Mode:</span>
            <span className="font-semibold text-white">
              {currentUser
                ? `${currentUser.name} (${currentUser.role.toUpperCase()})`
                : 'Guest / Public Viewer'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-0.5 rounded text-[11px] bg-white/10 hover:bg-rose-500/20 text-emerald-200 hover:text-rose-200 font-medium transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            ) : (
              <span className="text-[11px] text-emerald-400/80 font-medium hidden sm:inline">
                Civic Incident Network: Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {/* 1. Default Landing / Home Page */}
        {activeTab === 'home' && (
          <HomePage
            onNavigate={setActiveTab}
            onOpenLoginModal={() => handleOpenLogin('admin')}
            reports={reports}
            currentUser={currentUser}
          />
        )}

        {/* 2. Report Issue Form */}
        {activeTab === 'report' && (
          <ReportIssue
            currentUser={currentUser}
            onReportSubmitted={handleReportSubmitted}
            onViewCommunity={() => setActiveTab('feed')}
          />
        )}

        {/* 3. Live Incident Feed */}
        {activeTab === 'feed' && (
          <IncidentFeed
            reports={reports}
            currentUser={currentUser}
            onOpenReportForm={() => setActiveTab('report')}
            onUpdateReport={handleUpdateReport}
          />
        )}

        {/* 4. Real-Time Civic Waste Map */}
        {activeTab === 'map' && (
          <RealTimeWasteMap
            reports={reports}
            currentUser={currentUser}
            onSelectReport={(_report) => setActiveTab('feed')}
            onOpenReportForm={() => setActiveTab('report')}
          />
        )}

        {/* 5. Admin Dispatch Dashboard */}
        {activeTab === 'admin' && (
          <AdminDashboard
            reports={reports}
            onUpdateReport={handleUpdateReport}
            onOpenReportForm={() => setActiveTab('report')}
            onClearAllReports={handleClearAllReports}
          />
        )}

        {/* 6. Civic Impact & ESG Metrics */}
        {activeTab === 'impact' && <CivicImpactMetrics reports={reports} />}
      </main>

      {/* Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialRole={initialModalRole}
      />

      {/* Clean Civic Footer */}
      {activeTab !== 'home' && (
        <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">EcoPulse</span>
              <span>·</span>
              <span>Municipal Waste & Sanitation Route Dispatch</span>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              <span>Developed by <strong className="text-slate-700">Aditya Srivastava</strong></span>
              <span>·</span>
              <span>Clean Public Spaces Initiative</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  </APIProvider>
  );
}
