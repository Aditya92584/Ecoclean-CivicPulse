import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  LocateFixed,
  Navigation,
  Crosshair,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  ArrowRight,
  Sparkles,
  Layers,
  Radio,
} from 'lucide-react';
import { WasteReport } from '../types/wasteReport';
import { AuthUser } from '../types/auth';

interface RealTimeWasteMapProps {
  reports: WasteReport[];
  currentUser: AuthUser | null;
  onSelectReport?: (report: WasteReport) => void;
  onOpenReportForm?: () => void;
}

// Controller to smoothly pan map
const MapPanController: React.FC<{
  target: { lat: number; lng: number } | null;
  zoom?: number;
}> = ({ target, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !target) return;
    map.panTo(target);
    if (zoom) map.setZoom(zoom);
  }, [map, target, zoom]);
  return null;
};

// Calculate approximate distance in meters between two coordinates (Haversine formula)
function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export const RealTimeWasteMap: React.FC<RealTimeWasteMapProps> = ({
  reports,
  currentUser,
  onSelectReport,
  onOpenReportForm,
}) => {
  // User's live detected GPS coordinates
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [isTrackingLive, setIsTrackingLive] = useState<boolean>(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Selected incident for InfoWindow popup
  const [activeIncident, setActiveIncident] = useState<WasteReport | null>(null);

  // Map Filter State
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'my'>(() =>
    currentUser?.role === 'citizen' ? 'my' : 'all'
  );

  // Manual target for map pan
  const [panTarget, setPanTarget] = useState<{ lat: number; lng: number } | null>(null);

  // Initial map center
  const defaultCenter = useMemo(() => {
    return { lat: 28.6139, lng: 77.209 }; // New Delhi default
  }, []);

  // Detect current location once
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setTrackingError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const coords = { lat: latitude, lng: longitude, accuracy };
        setUserLocation(coords);
        setPanTarget({ lat: latitude, lng: longitude });
        setTrackingError(null);
      },
      (err) => {
        setTrackingError('Could not detect location. Please check browser GPS permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Automatically request location detection on component mount
  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // Continuous live location tracking (watchPosition)
  useEffect(() => {
    if (!isTrackingLive || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude, accuracy });
        setTrackingError(null);
      },
      (err) => {
        setTrackingError('Live tracking interrupted.');
        setIsTrackingLive(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isTrackingLive]);

  // Filter reports based on selected filters
  const filteredReports = useMemo(() => {
    const currentEmail = currentUser?.email?.toLowerCase().trim();
    const currentName = currentUser?.name?.toLowerCase().trim();

    return reports.filter((r) => {
      // Must have coordinates
      if (!r.location?.lat || !r.location?.lng) return false;

      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      // Scope filter (My complaints vs All)
      if (scopeFilter === 'my') {
        const itemEmail = r.reporterContact?.toLowerCase().trim();
        const itemName = r.reporterName?.toLowerCase().trim();
        const isMine =
          (currentEmail && itemEmail === currentEmail) ||
          (currentName && itemName === currentName);
        if (!isMine) return false;
      }

      return true;
    });
  }, [reports, statusFilter, scopeFilter, currentUser]);

  // Compute nearest incident distance to user
  const nearestDistance = useMemo(() => {
    if (!userLocation || filteredReports.length === 0) return null;
    let min = Infinity;
    for (const r of filteredReports) {
      if (r.location.lat && r.location.lng) {
        const d = getDistanceMeters(
          userLocation.lat,
          userLocation.lng,
          r.location.lat,
          r.location.lng
        );
        if (d < min) min = d;
      }
    }
    return min === Infinity ? null : min;
  }, [userLocation, filteredReports]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Top Banner & Control Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Real-Time Civic Waste Map
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              GPS Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Detects your exact coordinates and plots active waste dispatches with live distance tracking.
          </p>
        </div>

        {/* GPS Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={detectLocation}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LocateFixed className="w-3.5 h-3.5 text-emerald-600" />
            <span>Center on Me</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTrackingLive(!isTrackingLive)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              isTrackingLive
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isTrackingLive ? 'animate-pulse' : ''}`} />
            <span>{isTrackingLive ? 'Live Tracking Active' : 'Start Continuous GPS'}</span>
          </button>

          {onOpenReportForm && (
            <button
              type="button"
              onClick={onOpenReportForm}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span>+ Report Here</span>
            </button>
          )}
        </div>
      </div>

      {/* GPS Status / Accuracy Bar */}
      {userLocation && (
        <div className="bg-emerald-950 text-white px-4 py-2.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs border border-emerald-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-200">Current Position:</span>
            <span className="font-mono font-semibold text-white">
              {userLocation.lat.toFixed(5)}° N, {userLocation.lng.toFixed(5)}° E
            </span>
            <span className="text-emerald-400/80 text-[11px] hidden sm:inline">
              (±{Math.round(userLocation.accuracy)}m accuracy)
            </span>
          </div>

          {nearestDistance !== null && (
            <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Nearest Waste Incident:{' '}
                <strong className="text-white">
                  {nearestDistance > 1000
                    ? `${(nearestDistance / 1000).toFixed(1)} km`
                    : `${nearestDistance} meters`}
                </strong>
              </span>
            </div>
          )}
        </div>
      )}

      {trackingError && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{trackingError}</span>
        </div>
      )}

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Filter Pins:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Pins ({reports.filter((r) => r.location?.lat).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('resolved')}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              statusFilter === 'resolved'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Resolved
          </button>
        </div>

        {currentUser && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setScopeFilter('my')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                scopeFilter === 'my'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              My Reports
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                scopeFilter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Community
            </button>
          </div>
        )}
      </div>

      {/* Main Full Interactive Google Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-md h-[500px] sm:h-[600px] w-full bg-slate-100">
        <Map
          id="real-time-community-map"
          mapId="DEMO_MAP_ID"
          defaultCenter={defaultCenter}
          defaultZoom={14}
          gestureHandling="greedy"
          disableDefaultUI={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
        >
          {/* Pan map to live position when panTarget changes */}
          {panTarget && <MapPanController target={panTarget} zoom={16} />}

          {/* User's Current GPS Location Pin with Radar Wave */}
          {userLocation && (
            <AdvancedMarker
              position={{ lat: userLocation.lat, lng: userLocation.lng }}
              title="You Are Here (Live GPS)"
              zIndex={100}
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping" />
                <span className="absolute w-5 h-5 rounded-full bg-blue-500/50" />
                <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-md z-10" />
              </div>
            </AdvancedMarker>
          )}

          {/* Plotted Waste Incident Markers */}
          {filteredReports.map((incident) => {
            if (!incident.location.lat || !incident.location.lng) return null;

            const isResolved = incident.status === 'resolved';
            const isCritical = incident.severity === 'critical' || incident.urgency === 'urgent';

            const pinColor = isResolved
              ? '#059669' // Emerald
              : isCritical
              ? '#e11d48' // Rose / Red
              : '#d97706'; // Amber

            return (
              <AdvancedMarker
                key={incident.id}
                position={{ lat: incident.location.lat, lng: incident.location.lng }}
                title={`${incident.ticketNumber} - ${incident.categoryLabel}`}
                onClick={() => setActiveIncident(incident)}
              >
                <Pin
                  background={pinColor}
                  borderColor="#ffffff"
                  glyphColor="#ffffff"
                  scale={activeIncident?.id === incident.id ? 1.3 : 1.0}
                />
              </AdvancedMarker>
            );
          })}

          {/* Interactive InfoWindow Popup when marker is clicked */}
          {activeIncident && activeIncident.location.lat && activeIncident.location.lng && (
            <InfoWindow
              position={{
                lat: activeIncident.location.lat,
                lng: activeIncident.location.lng,
              }}
              onCloseClick={() => setActiveIncident(null)}
            >
              <div className="p-1 max-w-[260px] text-slate-800 space-y-2">
                {/* Photo Thumbnail */}
                {activeIncident.images && activeIncident.images.length > 0 && (
                  <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-100">
                    <img
                      src={activeIncident.images[0].url}
                      alt={activeIncident.categoryLabel}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <span className="font-mono font-bold text-slate-900">
                    {activeIncident.ticketNumber}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-semibold text-[10px] ${
                      activeIncident.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {activeIncident.status.toUpperCase()}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-900">
                  {activeIncident.categoryLabel}
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-2">
                  {activeIncident.description}
                </p>

                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{activeIncident.location.address}</span>
                </div>

                {userLocation && (
                  <div className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    Distance:{' '}
                    {getDistanceMeters(
                      userLocation.lat,
                      userLocation.lng,
                      activeIncident.location.lat,
                      activeIncident.location.lng
                    )}{' '}
                    meters from you
                  </div>
                )}

                {onSelectReport && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectReport(activeIncident);
                      setActiveIncident(null);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors mt-1"
                  >
                    <span>Inspect Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>

        {/* Floating Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-xs p-3 rounded-xl shadow-lg border border-slate-200 text-xs space-y-1.5 hidden sm:block">
          <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
            Map Legend
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-3 h-3 rounded-full bg-blue-600 ring-2 ring-blue-300" />
            <span>Your Live GPS Location</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Pending Dispatch</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-3 h-3 rounded-full bg-rose-600" />
            <span>Critical / Urgent</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-3 h-3 rounded-full bg-emerald-600" />
            <span>Resolved / Site Cleaned</span>
          </div>
        </div>
      </div>
    </div>
  );
};
