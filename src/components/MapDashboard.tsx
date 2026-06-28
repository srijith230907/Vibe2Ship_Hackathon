import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import L from 'leaflet';
import { MapPin, Layers, AlertCircle, CheckCircle2, Clock, LocateFixed } from 'lucide-react';
import type { MapIssue, IssueStatus } from '../types';
import { statusConfig, getCategory, severityLabel, timeAgo } from '../lib';

type StatusFilter = 'all' | IssueStatus;

interface MapDashboardProps {
  issues: MapIssue[];
  selectedIssue: MapIssue | null;
  onSelectIssue: (issue: MapIssue) => void;
  statusFilter: StatusFilter;
  onStatusFilter: (s: StatusFilter) => void;
}

function createMarkerIcon(status: IssueStatus): L.DivIcon {
  const hex = statusConfig[status].hex;
  return L.divIcon({
    className: 'civic-marker',
    html: `
      <div class="civic-marker-pin" style="color: ${hex}">
        ${status !== 'resolved' ? '<div class="pulse"></div>' : ''}
        <div class="ring"></div>
        <div class="dot"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createUserLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div class="user-location-pin">
        <div class="ping-ring"></div>
        <div class="ping-ring" style="animation-delay:0.5s"></div>
        <div class="user-dot"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const filterTabs: { id: StatusFilter; label: string; icon: typeof Layers }[] = [
  { id: 'all', label: 'All Issues', icon: Layers },
  { id: 'open', label: 'Open', icon: AlertCircle },
  { id: 'in-progress', label: 'In Progress', icon: Clock },
  { id: 'resolved', label: 'Resolved', icon: CheckCircle2 },
];

export function MapDashboard({
  issues,
  selectedIssue,
  onSelectIssue,
  statusFilter,
  onStatusFilter,
}: MapDashboardProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'found' | 'denied'>('idle');

  const filtered = useMemo(
    () => (statusFilter === 'all' ? issues : issues.filter((i) => i.status === statusFilter)),
    [issues, statusFilter]
  );

  const counts = useMemo(
    () => ({
      open: issues.filter((i) => i.status === 'open').length,
      'in-progress': issues.filter((i) => i.status === 'in-progress').length,
      resolved: issues.filter((i) => i.status === 'resolved').length,
    }),
    [issues]
  );

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const defaultCenter: [number, number] = [12.9716, 77.5946];

    mapInstance.current = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: false,
      trackResize: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 20,
      tileSize: 256,
      updateWhenIdle: false,
      updateWhenZooming: true,
    }).addTo(mapInstance.current);

    // Multi-stage layout invalidation
    const renderFrames = [50, 150, 300, 600, 1200];
    const timeouts = renderFrames.map((delay) =>
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize({ animate: false });
        }
      }, delay)
    );

    const handleResize = () => mapInstance.current?.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      timeouts.forEach(clearTimeout);
      window.removeEventListener('resize', handleResize);
      mapInstance.current?.remove();
      mapInstance.current = null;
      markersRef.current.clear();
      userMarkerRef.current = null;
    };
  }, []);

  // Single geolocation effect: set user location marker on map init
  useEffect(() => {
    if (!mapInstance.current) return;

    setLocating(true);

    if (!navigator.geolocation) {
      setLocating(false);
      setLocationStatus('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords: [number, number] = [latitude, longitude];

        mapInstance.current!.flyTo(coords, 15, { duration: 1.5 });

        if (userMarkerRef.current) userMarkerRef.current.remove();
        userMarkerRef.current = L.marker(coords, {
          icon: createUserLocationIcon(),
          zIndexOffset: 1000,
        }).addTo(mapInstance.current!);

        setLocating(false);
        setLocationStatus('found');
      },
      () => {
        setLocating(false);
        setLocationStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Recenter on user location button
  const recenterOnUser = useCallback(() => {
    if (!mapInstance.current) return;
    setLocating(true);

    if (!navigator.geolocation) {
      setLocating(false);
      setLocationStatus('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords: [number, number] = [latitude, longitude];
        mapInstance.current!.flyTo(coords, 15, { duration: 1 });

        if (userMarkerRef.current) userMarkerRef.current.remove();
        userMarkerRef.current = L.marker(coords, {
          icon: createUserLocationIcon(),
          zIndexOffset: 1000,
        }).addTo(mapInstance.current!);

        setLocating(false);
        setLocationStatus('found');
      },
      () => {
        setLocating(false);
        setLocationStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Render / update markers when filtered issues change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    filtered.forEach((issue) => {
      const marker = L.marker([issue.lat, issue.lng], {
        icon: createMarkerIcon(issue.status),
      }).addTo(map);

      const status = statusConfig[issue.status];
      const cat = getCategory(issue.category);

      marker.bindPopup(
        `<div style="min-width:180px">
          <p style="font-weight:600;font-size:13px;color:#f1f5f9;margin:0 0 2px;">${issue.title}</p>
          <p style="font-size:11px;color:#94a3b8;margin:0 0 4px;">${cat.emoji} ${issue.category}</p>
          <p style="font-size:11px;color:${status.hex};margin:0;">● ${status.label}</p>
        </div>`
      );

      marker.on('click', () => {
        onSelectIssue(issue);
      });

      markersRef.current.set(issue.id, marker);
    });
  }, [filtered, onSelectIssue]);

  // Fly to selected issue
  useEffect(() => {
    if (!selectedIssue || !mapInstance.current) return;
    mapInstance.current.flyTo([selectedIssue.lat, selectedIssue.lng], 16, { duration: 0.8 });
  }, [selectedIssue]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="absolute inset-0 w-full h-full block z-0" />

      {/* Top filter bar */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex flex-wrap items-center justify-between gap-3">
        <div className="glass-strong px-2 py-2 flex items-center gap-1 overflow-x-auto max-w-full">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onStatusFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-gradient-to-r from-neon-purple/30 to-neon-violet/20 text-white border border-neon-purple/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={recenterOnUser}
          disabled={locating}
          className="glass-strong px-4 py-2.5 flex items-center gap-2 text-xs font-medium text-slate-200 hover:text-white hover:border-neon-mint/30 transition-all disabled:opacity-60"
        >
          {locating ? (
            <div className="w-3.5 h-3.5 border-2 border-neon-mint/30 border-t-neon-mint rounded-full animate-spin" />
          ) : (
            <LocateFixed className="w-3.5 h-3.5 text-neon-mint" />
          )}
          {locating ? 'Locating...' : 'My Location'}
        </button>
      </div>

      {/* Location status indicator */}
      {locationStatus === 'denied' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] glass px-3 py-1.5 flex items-center gap-2 text-[11px] text-slate-400 animate-slide-in">
          <AlertCircle className="w-3 h-3 text-neon-amber" />
          Location unavailable — showing Bengaluru area
        </div>
      )}

      {/* Bottom stats bar */}
      <div className="absolute bottom-4 left-4 z-[500] glass-strong px-4 py-3 flex items-center gap-5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-red shadow-neon-purple" />
          <span className="text-xs text-slate-300">
            <span className="font-bold text-white">{counts.open}</span> Open
          </span>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-amber" />
          <span className="text-xs text-slate-300">
            <span className="font-bold text-white">{counts['in-progress']}</span> In Progress
          </span>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-mint shadow-neon-mint" />
          <span className="text-xs text-slate-300">
            <span className="font-bold text-white">{counts.resolved}</span> Resolved
          </span>
        </div>
      </div>

      {/* Issue list panel */}
      <div className="absolute top-20 right-4 bottom-20 z-[500] w-80 hidden lg:flex flex-col">
        <div className="glass-strong flex flex-col h-full overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neon-purple" />
              <p className="text-sm font-semibold text-white">Nearby Reports</p>
            </div>
            <span className="text-xs text-slate-500 font-mono">{filtered.length} found</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filtered.map((issue) => {
              const status = statusConfig[issue.status];
              const sev = severityLabel(issue.severity);
              const cat = getCategory(issue.category);
              return (
                <button
                  key={issue.id}
                  onClick={() => onSelectIssue(issue)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    selectedIssue?.id === issue.id
                      ? 'bg-white/[0.08] border-neon-purple/30'
                      : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                      style={{ background: `${status.hex}15` }}
                    >
                      {cat.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {issue.title}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{issue.address}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${status.bg} ${status.text}`}
                        >
                          {status.label}
                        </span>
                        <span className={`text-[10px] font-mono ${sev.color}`}>
                          SEV {issue.severity}
                        </span>
                        <span className="text-[10px] text-slate-600">
                          {timeAgo(issue.reportedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
