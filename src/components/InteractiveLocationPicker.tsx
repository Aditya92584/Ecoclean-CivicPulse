import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary,
  MapMouseEvent,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  LocateFixed,
  Compass,
  Crosshair,
} from 'lucide-react';
import { ReportLocation } from '../types/wasteReport';

interface InteractiveLocationPickerProps {
  location: ReportLocation;
  onChange: (updated: ReportLocation) => void;
}

// Controller component to pan the map programmatically when coordinates update
const MapCenterController: React.FC<{
  center: { lat: number; lng: number } | null;
  zoom?: number;
}> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !center) return;
    map.panTo(center);
    if (zoom) {
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);

  return null;
};

export const InteractiveLocationPicker: React.FC<InteractiveLocationPickerProps> = ({
  location,
  onChange,
}) => {
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [accuracyNotice, setAccuracyNotice] = useState<string | null>(null);

  // Load the official Google Maps Geocoding library for reverse geocoding
  const geocodingLib = useMapsLibrary('geocoding');
  const geocoder = useMemo(
    () => (geocodingLib ? new geocodingLib.Geocoder() : null),
    [geocodingLib]
  );

  // Default coordinate center (fallback to New Delhi or active coordinates)
  const defaultCenter = useMemo(
    () => ({
      lat: location.lat || 28.6139,
      lng: location.lng || 77.209,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const activePosition = useMemo(() => {
    if (location.lat != null && location.lng != null) {
      return { lat: location.lat, lng: location.lng };
    }
    return null;
  }, [location.lat, location.lng]);

  // Reverse geocodes coordinates to street address and neighborhood
  const reverseGeocode = useCallback(
    (lat: number, lng: number, accuracy?: number | null) => {
      if (!geocoder) {
        onChange({
          ...location,
          lat,
          lng,
          accuracy: accuracy || null,
          detected: true,
          isDetecting: false,
          error: null,
          address: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
          neighborhood: 'Civic Area',
        });
        return;
      }

      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === 'OK' && results && results.length > 0) {
          const best = results[0];
          const fullAddress = best.formatted_address || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;

          // Extract sublocality or neighborhood from address components
          let neighborhood = '';
          for (const comp of best.address_components) {
            if (
              comp.types.includes('sublocality') ||
              comp.types.includes('neighborhood') ||
              comp.types.includes('locality')
            ) {
              neighborhood = comp.long_name;
              break;
            }
          }

          onChange({
            ...location,
            lat,
            lng,
            accuracy: accuracy || null,
            detected: true,
            isDetecting: false,
            error: null,
            address: fullAddress,
            neighborhood: neighborhood || 'Local Sector',
          });
        } else {
          onChange({
            ...location,
            lat,
            lng,
            accuracy: accuracy || null,
            detected: true,
            isDetecting: false,
            error: null,
            address: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            neighborhood: 'Verified Location',
          });
        }
      });
    },
    [geocoder, location, onChange]
  );

  // Trigger real-time browser GPS detection
  const handleDetectCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingGps(true);
    setGpsError(null);
    setAccuracyNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setIsDetectingGps(false);
        setAccuracyNotice(`Accurate to within ±${Math.round(accuracy)} meters`);
        reverseGeocode(latitude, longitude, accuracy);
      },
      (err) => {
        setIsDetectingGps(false);
        let msg = 'Could not access current location. Please click on the map to set pin.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please allow location access or click on the map.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Please try again or click on the map.';
        }
        setGpsError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [reverseGeocode]);

  // Handle click on map to adjust or pinpoint waste location
  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (!e.detail.latLng) return;
      const { lat, lng } = e.detail.latLng;
      setAccuracyNotice('Pinpoint set manually on map');
      reverseGeocode(lat, lng, 1);
    },
    [reverseGeocode]
  );

  return (
    <div className="space-y-4">
      {/* Top GPS Detection Trigger Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Real-Time GPS Location</span>
              {location.detected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Locked
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Detect live GPS or click anywhere on the Google Map to pinpoint waste.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDetectCurrentLocation}
          disabled={isDetectingGps}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-60"
        >
          {isDetectingGps ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Detecting Live GPS...</span>
            </>
          ) : (
            <>
              <Crosshair className="w-4 h-4 text-emerald-200" />
              <span>Detect Current Location</span>
            </>
          )}
        </button>
      </div>

      {/* GPS Error Notification */}
      {gpsError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Accuracy & Coords Chip */}
      {activePosition && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-mono text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {activePosition.lat.toFixed(6)}° N, {activePosition.lng.toFixed(6)}° E
            </span>
          </div>
          {accuracyNotice && (
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
              {accuracyNotice}
            </span>
          )}
        </div>
      )}

      {/* Interactive Google Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-inner h-[280px] sm:h-[340px] w-full bg-slate-100">
        <Map
          id="incident-picker-map"
          mapId="DEMO_MAP_ID"
          defaultCenter={defaultCenter}
          defaultZoom={15}
          gestureHandling="greedy"
          disableDefaultUI={false}
          onClick={handleMapClick}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
        >
          {/* Pan map smoothly when activePosition changes */}
          {activePosition && <MapCenterController center={activePosition} zoom={16} />}

          {/* Active Incident Pin */}
          {activePosition && (
            <AdvancedMarker position={activePosition} title="Reported Waste Location">
              <Pin
                background="#059669"
                borderColor="#065f46"
                glyphColor="#ffffff"
                scale={1.2}
              />
            </AdvancedMarker>
          )}
        </Map>

        {/* Floating Quick Action Overlay */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleDetectCurrentLocation}
            title="Recenter to my live GPS location"
            className="p-2.5 rounded-xl bg-white/95 backdrop-blur-xs text-slate-700 hover:text-emerald-600 hover:bg-white shadow-md border border-slate-200 transition-all cursor-pointer"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        </div>

        {/* Map Helper Badge */}
        <div className="absolute bottom-3 left-3 z-10 bg-slate-900/85 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 shadow-md">
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span>Click anywhere on the map to fine-tune location</span>
        </div>
      </div>

      {/* Street Address & Neighborhood Form Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Detected Street Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={location.address}
            onChange={(e) =>
              onChange({
                ...location,
                address: e.target.value,
              })
            }
            placeholder="e.g. 14 Market Street, Sector 4"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Area / Landmark
          </label>
          <input
            type="text"
            value={location.neighborhood || ''}
            onChange={(e) =>
              onChange({
                ...location,
                neighborhood: e.target.value,
              })
            }
            placeholder="e.g. Near Metro Gate 2, Central Market"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Specific Spot Notes (Optional)
        </label>
        <input
          type="text"
          value={location.manualNotes || ''}
          onChange={(e) =>
            onChange({
              ...location,
              manualNotes: e.target.value,
            })
          }
          placeholder="e.g. Behind the community bus shelter, next to storm drain"
          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all"
        />
      </div>
    </div>
  );
};
