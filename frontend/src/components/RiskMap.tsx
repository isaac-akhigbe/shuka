"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, LayersControl, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LocationRisk, RiskLevel } from "@/types/location";
import { RISK_STYLES } from "@/lib/risk";

interface Props {
  locations: LocationRisk[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const LEVELS: RiskLevel[] = ["high", "medium", "low"];

// Makes sure the map has its correct size and zooms to show every state
function FitToLocations({ locations }: { locations: LocationRisk[] }) {
  const map = useMap();

  useEffect(() => {
    const fit = () => {
      map.invalidateSize();
      map.fitBounds(
        locations.map((l) => [l.lat, l.lon] as [number, number]),
        { padding: [40, 40] }
      );
    };
    const timer = setTimeout(fit, 100);
    window.addEventListener("resize", fit);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", fit);
    };
  }, [map, locations]);

  return null;
}

export default function RiskMap({ locations, selectedId, onSelect }: Props) {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[10.6, 8.3]}
        zoom={6}
        minZoom={4}
        scrollWheelZoom
        className="h-full w-full"
      >
        {/* Map style switcher, top right corner */}
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Clean">
            <TileLayer
              attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
              maxZoom={18}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <FitToLocations locations={locations} />

        {locations.map((loc) => {
          const isSelected = loc.id === selectedId;
          const color = RISK_STYLES[loc.riskLevel].color;
          return (
            <CircleMarker
              key={loc.id}
              center={[loc.lat, loc.lon]}
              radius={isSelected ? 20 : 8 + loc.riskPercent / 5}
              pathOptions={{
                color: isSelected ? "#ffffff" : color,
                weight: isSelected ? 3 : 2,
                fillColor: color,
                fillOpacity: isSelected ? 0.95 : 0.7,
                className: loc.riskLevel === "high" && !isSelected ? "marker-high" : "",
              }}
              eventHandlers={{ click: () => onSelect(loc.id) }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                {loc.name} · {loc.riskPercent}% risk
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend. z-index keeps it above the map layers */}
      <div className="absolute bottom-6 left-3 z-[1000] rounded-xl border border-zinc-200 bg-white/90 shadow-sm px-3 py-2 text-[11px] backdrop-blur sm:px-4 sm:py-3 sm:text-xs">
        <p className="mb-2 font-semibold uppercase tracking-wider text-zinc-500">
          False onset risk
        </p>
        <ul className="space-y-1.5">
          {LEVELS.map((level) => (
            <li key={level} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ background: RISK_STYLES[level].color }}
              />
              <span className="text-zinc-700">{RISK_STYLES[level].label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 hidden text-[10px] text-zinc-500 sm:block">Circle size = risk %</p>
      </div>
    </div>
  );
}